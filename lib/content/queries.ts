import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type {
  Activity,
  ActivityPlacement,
  CarouselImage,
  HeroContent,
  SiteSettings,
  TeamMember,
  Video,
} from "@/lib/types/content";

/**
 * Read side of the CMS.
 *
 * Every function here swallows errors and returns a safe empty value. The
 * public site must not 500 because a table is missing, a policy is wrong, or
 * the migration has not been run yet — callers render their fallback instead.
 * Errors are logged so problems stay visible in the server console.
 *
 * Each fetcher is wrapped in React `cache()` so it runs once per request no
 * matter how many components ask for it. The layout, its metadata and the page
 * all call getSiteSettings(), which was three identical queries per render.
 */

function warn(scope: string, error: { message: string } | null) {
  if (error) console.warn(`[content] ${scope}: ${error.message}`);
}

export const getHeroContent = cache(async (): Promise<HeroContent | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hero_content")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  warn("hero_content", error);
  return (data as HeroContent | null) ?? null;
});

export const getCarouselImages = cache(async (): Promise<CarouselImage[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("carousel_images")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  warn("carousel_images", error);
  return (data as CarouselImage[] | null) ?? [];
});

export const getTeamMembers = cache(async (): Promise<TeamMember[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  warn("team_members", error);
  return (data as TeamMember[] | null) ?? [];
});

export const getSiteSettings = cache(async (): Promise<SiteSettings | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  warn("site_settings", error);
  return (data as SiteSettings | null) ?? null;
});

export const getActivities = cache(
  async (placement?: ActivityPlacement): Promise<Activity[]> => {
    const supabase = await createClient();

    let query = supabase
      .from("activities")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (placement) query = query.eq("placement", placement);

    const { data, error } = await query;

    warn(`activities${placement ? `:${placement}` : ""}`, error);
    return (data as Activity[] | null) ?? [];
  }
);

export const getVideos = cache(async (): Promise<Video[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  warn("videos", error);
  return (data as Video[] | null) ?? [];
});

// ---------------------------------------------------------------------------
// Admin reads — include unpublished rows. RLS still enforces the admin check;
// these differ only in not filtering by is_published.
// ---------------------------------------------------------------------------

export const getAllCarouselImages = cache(async (): Promise<CarouselImage[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("carousel_images")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  warn("admin:carousel_images", error);
  return (data as CarouselImage[] | null) ?? [];
});

export const getAllTeamMembers = cache(async (): Promise<TeamMember[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .order("sort_order", { ascending: true });

  warn("admin:team_members", error);
  return (data as TeamMember[] | null) ?? [];
});

export const getAllActivities = cache(async (): Promise<Activity[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("placement", { ascending: true })
    .order("sort_order", { ascending: true });

  warn("admin:activities", error);
  return (data as Activity[] | null) ?? [];
});

export const getAllVideos = cache(async (): Promise<Video[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("sort_order", { ascending: true });

  warn("admin:videos", error);
  return (data as Video[] | null) ?? [];
});
