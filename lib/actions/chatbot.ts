"use server";

import { revalidatePath } from "next/cache";

import {
  boolField,
  fail,
  guarded,
  intField,
  ok,
  optionalText,
  requiredText,
  requireAdmin,
} from "./shared";

export async function updateChatbotSettings(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const isEnabled = boolField(formData, "is_enabled");
    const brief = optionalText(formData, "brief", 20000);

    // Turning it on without grounding material would leave the model free to
    // improvise about Bangladeshi law, which is the one thing this must not do.
    if (isEnabled && !brief) {
      return fail("চ্যাট চালু করার আগে ব্রিফ লিখুন — এটি ছাড়া উত্তর ভিত্তিহীন হবে।");
    }

    const maxTurns = Math.min(50, Math.max(1, intField(formData, "max_turns", 12)));
    // Null keeps every chat; a number deletes older ones when a chat starts.
    const keepForever = boolField(formData, "keep_forever");
    const retentionDays = keepForever
      ? null
      : intField(formData, "history_retention_days", 365);
    if (retentionDays !== null && (retentionDays < 7 || retentionDays > 3650)) {
      return fail("চ্যাট হিস্ট্রি ৭ থেকে ৩৬৫০ দিন রাখা যাবে, অথবা কখনো মুছবেন না বেছে নিন।");
    }

    const { error } = await auth.supabase.from("chatbot_settings").upsert({
      id: true,
      is_enabled: isEnabled,
      bot_name: requiredText(formData, "bot_name", "নাম", 60),
      bot_name_en: optionalText(formData, "bot_name_en", 60),
      greeting: requiredText(formData, "greeting", "শুভেচ্ছা বার্তা", 300),
      greeting_en: optionalText(formData, "greeting_en", 300),
      brief,
      brief_en: optionalText(formData, "brief_en", 20000),
      disclaimer: requiredText(formData, "disclaimer", "দাবিত্যাগ", 300),
      disclaimer_en: optionalText(formData, "disclaimer_en", 300),
      model: requiredText(formData, "model", "মডেল", 60),
      max_turns: maxTurns,
      history_retention_days: retentionDays,
    });

    if (error) return fail(error.message);

    revalidatePath("/", "layout");
    return ok();
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * An admin's verdict on whether a chat is genuine. `null` hands the decision
 * back to Claude's flag. Only this column is writable (migration 0020).
 */
export async function reviewChatCase(id: string, suspicious: boolean | null) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);
    if (typeof id !== "string" || !UUID.test(id)) return fail("কথোপকথনটি পাওয়া যায়নি।");
    if (suspicious !== null && typeof suspicious !== "boolean") {
      return fail("সিদ্ধান্তটি বোঝা যায়নি।");
    }

    const { data, error } = await auth.supabase
      .from("chat_conversations")
      .update({ suspicious_override: suspicious })
      .eq("id", id)
      .select("id");

    if (error) return fail(error.message);
    if (!data?.length) return fail("কথোপকথনটি পাওয়া যায়নি — হয়তো মুছে ফেলা হয়েছে।");

    revalidatePath("/admin/cases");
    return ok();
  });
}
