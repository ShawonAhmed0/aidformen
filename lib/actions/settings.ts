"use server";

import { revalidatePath } from "next/cache";

import {
  boolField,
  fail,
  guarded,
  hrefField,
  ok,
  optionalText,
  requiredText,
  requireAdmin,
  urlField,
} from "./shared";

/**
 * Site settings are consumed by the navbar, footer, contact page and the
 * announcement banner — every route shows at least one of them, so the whole
 * layout tree is revalidated rather than a single path.
 */
export async function updateSiteSettings(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const payload = {
      organisation_name: requiredText(formData, "organisation_name", "সংগঠনের নাম", 120),
      organisation_name_en: optionalText(formData, "organisation_name_en", 120),
      tagline: optionalText(formData, "tagline", 300),
      tagline_en: optionalText(formData, "tagline_en", 300),

      emergency_phone: optionalText(formData, "emergency_phone", 40),
      contact_phone: optionalText(formData, "contact_phone", 40),
      contact_email: optionalText(formData, "contact_email", 200),
      address: optionalText(formData, "address", 300),
      address_en: optionalText(formData, "address_en", 300),
      office_hours: optionalText(formData, "office_hours", 200),
      office_hours_en: optionalText(formData, "office_hours_en", 200),

      facebook_url: urlField(formData, "facebook_url", "ফেসবুক লিঙ্ক"),
      youtube_url: urlField(formData, "youtube_url", "ইউটিউব লিঙ্ক"),
      website_url: urlField(formData, "website_url", "ওয়েবসাইট"),

      announcement_enabled: boolField(formData, "announcement_enabled"),
      announcement_badge: optionalText(formData, "announcement_badge", 60),
      announcement_badge_en: optionalText(formData, "announcement_badge_en", 60),
      announcement_title: optionalText(formData, "announcement_title", 200),
      announcement_title_en: optionalText(formData, "announcement_title_en", 200),
      announcement_body: optionalText(formData, "announcement_body", 600),
      announcement_body_en: optionalText(formData, "announcement_body_en", 600),
      announcement_cta_label: optionalText(formData, "announcement_cta_label", 60),
      announcement_cta_label_en: optionalText(formData, "announcement_cta_label_en", 60),
      announcement_cta_href: hrefField(formData, "announcement_cta_href"),
    };

    // A CHECK constraint pins the primary key to `true`, so the table can only
    // ever hold one row — upsert covers both "seeded" and "somehow empty".
    const { error } = await auth.supabase
      .from("site_settings")
      .upsert({ id: true, ...payload });

    if (error) return fail(error.message);

    revalidatePath("/", "layout");
    return ok();
  });
}
