/**
 * Row shapes for the CMS tables created in supabase/migrations/0001_admin_cms.sql.
 *
 * Hand-written rather than generated so the repo has no dependency on the
 * Supabase CLI. If you later run `supabase gen types typescript`, these can be
 * replaced wholesale — the field names match the columns exactly.
 */

export type HeroContent = {
  id: string;
  title: string | null;
  description: string | null;
  eyebrow: string | null;
  primary_cta_label: string | null;
  primary_cta_href: string | null;
  secondary_cta_label: string | null;
  secondary_cta_href: string | null;
  title_en: string | null;
  description_en: string | null;
  eyebrow_en: string | null;
  primary_cta_label_en: string | null;
  secondary_cta_label_en: string | null;
  updated_at: string | null;
};

export type CarouselImage = {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  alt_text: string | null;
  title_en: string | null;
  subtitle_en: string | null;
  alt_text_en: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string | null;
  /** Point that must survive the crop, as percentages. See migration 0004. */
  focal_x: number;
  focal_y: number;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  quote: string | null;
  statement: string | null;
  bio: string | null;
  photo_url: string | null;
  signature_url: string | null;
  profile_pdf_url: string | null;
  name_en: string | null;
  role_en: string | null;
  quote_en: string | null;
  statement_en: string | null;
  bio_en: string | null;
  sort_order: number;
  is_published: boolean;
  focal_x: number;
  focal_y: number;
};

/**
 * `object-position` for a focal point, safe when the columns are missing —
 * a database that has not run migration 0004 yields the CSS default.
 */
export function focalPosition(
  x: number | null | undefined,
  y: number | null | undefined
): string {
  return `${x ?? 50}% ${y ?? 50}%`;
}

export type SiteSettings = {
  id: boolean;
  organisation_name: string | null;
  tagline: string | null;
  emergency_phone: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  office_hours: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  website_url: string | null;
  announcement_enabled: boolean;
  announcement_badge: string | null;
  announcement_title: string | null;
  announcement_body: string | null;
  announcement_cta_label: string | null;
  announcement_cta_href: string | null;
  organisation_name_en: string | null;
  tagline_en: string | null;
  address_en: string | null;
  office_hours_en: string | null;
  announcement_badge_en: string | null;
  announcement_title_en: string | null;
  announcement_body_en: string | null;
  announcement_cta_label_en: string | null;
};

export const activityPlacements = [
  "feature",
  "advisory",
  "secondary",
  "archive",
] as const;

export type ActivityPlacement = (typeof activityPlacements)[number];

export type Activity = {
  id: string;
  placement: ActivityPlacement;
  category: string | null;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  event_date: string | null;
  location: string | null;
  href: string | null;
  action_label: string | null;
  category_en: string | null;
  title_en: string | null;
  excerpt_en: string | null;
  location_en: string | null;
  action_label_en: string | null;
  sort_order: number;
  is_published: boolean;
};

export type Video = {
  id: string;
  title: string;
  title_en: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  duration: string | null;
  year: string | null;
  sort_order: number;
  is_published: boolean;
};
