import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Uniform result shape for every server action. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export const fail = (error: string): ActionResult<never> => ({ ok: false, error });
export const ok = <T>(data?: T): ActionResult<T> => ({ ok: true, data });

/**
 * Gate for every mutating action.
 *
 * Row level security already blocks non-admin writes at the database, so this
 * is defence in depth rather than the only check — but it turns a confusing
 * RLS rejection into a clear message, and stops us doing storage work for a
 * request that will be refused anyway.
 */
export async function requireAdmin(): Promise<
  { ok: true; supabase: SupabaseClient } | { ok: false; error: string }
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "আপনি লগইন করা নেই।" };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) return { ok: false, error: "প্রোফাইল যাচাই করা যায়নি।" };
  if (profile?.role !== "admin") return { ok: false, error: "আপনার অনুমতি নেই।" };

  return { ok: true, supabase };
}

/**
 * Gate for member-level actions: posting, commenting, reacting.
 *
 * Same defence-in-depth role as requireAdmin — RLS already refuses an
 * unapproved member's writes, but this turns that into a message they can act
 * on, and returns the user id the actions need for author_id.
 */
export async function requireApprovedMember(): Promise<
  | { ok: true; supabase: SupabaseClient; userId: string; isAdmin: boolean }
  | { ok: false; error: string }
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "আপনি লগইন করা নেই।" };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return { ok: false, error: "প্রোফাইল যাচাই করা যায়নি।" };

  const isAdmin = profile?.role === "admin";
  if (!isAdmin && profile?.status !== "approved") {
    return {
      ok: false,
      error: "আপনার সদস্যপদ এখনো অনুমোদিত হয়নি। অনুমোদনের পর ফোরামে অংশ নিতে পারবেন।",
    };
  }

  return { ok: true, supabase, userId: user.id, isAdmin };
}

// ---------------------------------------------------------------------------
// Field readers. Hand-rolled rather than pulling in a schema library, since
// these forms need only trimming, length limits and a couple of enums.
// ---------------------------------------------------------------------------

/** Required text. Throws FieldError, which the action wrappers convert. */
export class FieldError extends Error {}

export function requiredText(
  form: FormData,
  key: string,
  label: string,
  max = 500
): string {
  const value = (form.get(key) as string | null)?.trim() ?? "";
  if (!value) throw new FieldError(`${label} লিখুন।`);
  if (value.length > max)
    throw new FieldError(`${label} সর্বোচ্চ ${max} অক্ষরের হতে পারে।`);
  return value;
}

/**
 * Optional text. Empty string becomes null so "not translated" stays null.
 *
 * Over-long input is refused, not sliced. Slicing lost the tail of a long
 * paragraph silently — the save reported success and the editor only found out
 * when the public page rendered a sentence that stopped mid-word.
 */
export function optionalText(
  form: FormData,
  key: string,
  max = 2000,
  label?: string
): string | null {
  const value = (form.get(key) as string | null)?.trim() ?? "";
  if (!value) return null;

  if (value.length > max) {
    throw new FieldError(
      `${label ?? "লেখাটি"} সর্বোচ্চ ${max} অক্ষরের হতে পারে। এখন ${value.length} অক্ষর আছে।`
    );
  }

  return value;
}

export function boolField(form: FormData, key: string): boolean {
  const value = form.get(key);
  return value === "true" || value === "on" || value === "1";
}

export function intField(form: FormData, key: string, fallback = 0): number {
  const parsed = Number.parseInt((form.get(key) as string | null) ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Keeps a percentage inside 0–100 so it can never trip the CHECK constraint. */
export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Optional ISO date (yyyy-mm-dd) or null. */
export function dateField(form: FormData, key: string): string | null {
  const value = (form.get(key) as string | null)?.trim() ?? "";
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new FieldError("তারিখ সঠিক নয়।");
  return value;
}

/**
 * Only allow internal paths or absolute http(s) URLs, so a stored link cannot
 * become a `javascript:` payload rendered into an href.
 */
export function hrefField(form: FormData, key: string): string | null {
  const value = (form.get(key) as string | null)?.trim() ?? "";
  if (!value) return null;

  if (value.startsWith("/")) return value;

  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    /* falls through */
  }

  throw new FieldError("লিঙ্কটি সঠিক নয়। '/' দিয়ে শুরু করুন অথবা সম্পূর্ণ URL দিন।");
}

/**
 * Absolute http(s) URL or null. Unlike `hrefField` this rejects internal paths —
 * a social profile or external website is never a path on this site, and
 * storing one would render a link that goes nowhere.
 */
export function urlField(form: FormData, key: string, label: string): string | null {
  const value = (form.get(key) as string | null)?.trim() ?? "";
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    /* falls through */
  }

  throw new FieldError(`${label} একটি সম্পূর্ণ ঠিকানা হতে হবে, যেমন https://…`);
}

export function enumField<T extends readonly string[]>(
  form: FormData,
  key: string,
  allowed: T,
  fallback: T[number]
): T[number] {
  const value = (form.get(key) as string | null) ?? "";
  return (allowed as readonly string[]).includes(value)
    ? (value as T[number])
    : fallback;
}

/** Wraps an action body so FieldError becomes a clean result instead of a crash. */
export async function guarded<T>(
  run: () => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof FieldError) return fail(error.message);
    console.error("[action]", error);
    return fail("অপ্রত্যাশিত সমস্যা হয়েছে। আবার চেষ্টা করুন।");
  }
}
