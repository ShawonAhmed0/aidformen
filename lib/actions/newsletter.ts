"use server";

import { createClient } from "@/lib/supabase/server";
import { fail, guarded, ok } from "./shared";

/**
 * Public newsletter signup.
 *
 * Deliberately not behind requireAdmin — anyone may subscribe. The table's RLS
 * allows anonymous INSERT but no SELECT, so one visitor cannot read another's
 * address.
 */
export async function subscribeToNewsletter(formData: FormData) {
  return guarded(async () => {
    const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";

    if (!email) return fail("ইমেইল ঠিকানা লিখুন।");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail("সঠিক ইমেইল ঠিকানা লিখুন।");
    }
    if (email.length > 254) return fail("ইমেইল ঠিকানাটি অনেক বড়।");

    const supabase = await createClient();

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email });

    if (error) {
      // 23505 = unique violation. Already subscribed is a success from the
      // visitor's point of view, and confirming it does not leak anything they
      // did not already type.
      if (error.code === "23505") return ok();
      return fail("সাবস্ক্রাইব করা যায়নি। পরে আবার চেষ্টা করুন।");
    }

    return ok();
  });
}
