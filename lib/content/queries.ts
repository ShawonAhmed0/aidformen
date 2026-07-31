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
 */

function warn(scope: string, error: { message: string } | null) {
  if (error) console.warn(`[content] ${scope}: ${error.message}`);
}

export async function getHeroContent(): Promise<HeroContent | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hero_content")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  warn("hero_content", error);
  return (data as HeroContent | null) ?? null;
}

export async function getCarouselImages(): Promise<CarouselImage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("carousel_images")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  warn("carousel_images", error);
  return (data as CarouselImage[] | null) ?? [];
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  warn("team_members", error);
  return (data as TeamMember[] | null) ?? [];
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  warn("site_settings", error);
  return (data as SiteSettings | null) ?? null;
}

export async function getActivities(
  placement?: ActivityPlacement
): Promise<Activity[]> {
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

export async function getVideos(): Promise<Video[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  warn("videos", error);
  return (data as Video[] | null) ?? [];
}

// ---------------------------------------------------------------------------
// Admin reads — include unpublished rows. RLS still enforces the admin check;
// these differ only in not filtering by is_published.
// ---------------------------------------------------------------------------

export async function getAllCarouselImages(): Promise<CarouselImage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("carousel_images")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  warn("admin:carousel_images", error);
  return (data as CarouselImage[] | null) ?? [];
}

export async function getAllTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .order("sort_order", { ascending: true });

  warn("admin:team_members", error);
  return (data as TeamMember[] | null) ?? [];
}

export async function getAllActivities(): Promise<Activity[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("placement", { ascending: true })
    .order("sort_order", { ascending: true });

  warn("admin:activities", error);
  return (data as Activity[] | null) ?? [];
}

export async function getAllVideos(): Promise<Video[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("sort_order", { ascending: true });

  warn("admin:videos", error);
  return (data as Video[] | null) ?? [];
}
