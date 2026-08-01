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
    });

    if (error) return fail(error.message);

    revalidatePath("/", "layout");
    return ok();
  });
}
