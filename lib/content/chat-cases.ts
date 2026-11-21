import { createClient } from "@/lib/supabase/server";
import {
  isChatCategory,
  isFlagged,
  type ChatCase,
  type ChatCategoryId,
} from "@/lib/types/chatbot";

/**
 * Reads for the admin Problem feed (/admin/cases). Days are Dhaka days: the
 * foundation and its visitors are there, and "today" must not roll over at
 * 6am local time.
 */

const TZ_OFFSET = "+06:00"; // Asia/Dhaka, no daylight saving.
const DAY = /^\d{4}-\d{2}-\d{2}$/;
/** A year is the widest range the feed or the export will read at once. */
const MAX_RANGE_DAYS = 366;
/** A safety cap on one range, far above a year of real traffic today. */
const MAX_ROWS = 20_000;

export type CaseView = "all" | "flagged";

export type CaseFilters = {
  from: string;
  to: string;
  category: ChatCategoryId | null;
  view: CaseView;
};

export type CaseStats = {
  total: number;
  people: number;
  flagged: number;
  /** Per category, most frequent first. `null` is "not clear yet". */
  byCategory: { id: ChatCategoryId | null; count: number }[];
};

export type CaseResult =
  | { ok: true; cases: ChatCase[]; truncated: boolean }
  | { ok: false; reason: "migration" | "failed" };

const COLUMNS =
  "id, visitor_name, phone, locale, category, age, occupation, occupation_group, ai_summary, ai_summary_en, summary, is_suspicious, suspicious_reason, suspicious_override, tagged_at, message_count, created_at, updated_at";

export function dhakaDay(date = new Date()) {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function shiftDay(day: string, days: number) {
  const date = new Date(`${day}T12:00:00${TZ_OFFSET}`);
  date.setUTCDate(date.getUTCDate() + days);
  return dhakaDay(date);
}

function validDay(value: unknown): string | null {
  if (typeof value !== "string" || !DAY.test(value)) return null;
  return Number.isNaN(new Date(`${value}T00:00:00${TZ_OFFSET}`).getTime()) ? null : value;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Today by default. Reversed dates are swapped; ranges cap at a year. */
export function parseCaseFilters(
  params: Record<string, string | string[] | undefined>
): CaseFilters {
  const today = dhakaDay();
  let from = validDay(first(params.from)) ?? today;
  let to = validDay(first(params.to)) ?? from;
  if (from > to) [from, to] = [to, from];
  if (shiftDay(from, MAX_RANGE_DAYS - 1) < to) from = shiftDay(to, -(MAX_RANGE_DAYS - 1));

  const category = first(params.category);
  return {
    from,
    to,
    category: isChatCategory(category) ? category : null,
    view: first(params.view) === "flagged" ? "flagged" : "all",
  };
}

/** Every conversation started in the range, newest first. */
export async function getChatCases(filters: CaseFilters): Promise<CaseResult> {
  const supabase = await createClient();
  const start = `${filters.from}T00:00:00${TZ_OFFSET}`;
  const end = `${shiftDay(filters.to, 1)}T00:00:00${TZ_OFFSET}`;

  const cases: ChatCase[] = [];
  const pageSize = 1000;
  for (let offset = 0; offset < MAX_ROWS; offset += pageSize) {
    const { data, error } = await supabase
      .from("chat_conversations")
      .select(COLUMNS)
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.warn(`[chat-cases] ${error.code}: ${error.message}`);
      // 42703: a column from migration 0020 does not exist yet.
      return { ok: false, reason: error.code === "42703" ? "migration" : "failed" };
    }

    cases.push(...((data ?? []) as ChatCase[]));
    if (!data || data.length < pageSize) return { ok: true, cases, truncated: false };
  }

  return { ok: true, cases, truncated: true };
}

/**
 * Figures for the range. Flagged sessions are left out of every count except
 * their own, so a burst of spam cannot pass for a trend.
 */
export function caseStats(cases: ChatCase[]): CaseStats {
  const genuine = cases.filter((c) => !isFlagged(c));
  const counts = new Map<ChatCategoryId | null, number>();
  for (const c of genuine) {
    counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
  }

  return {
    total: genuine.length,
    // Phones are unverified, so this is "different numbers", not proven people.
    people: new Set(genuine.map((c) => c.phone)).size,
    flagged: cases.length - genuine.length,
    byCategory: [...counts]
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count),
  };
}

/** What the list shows: the category and the review view applied. */
export function filterCases(cases: ChatCase[], filters: CaseFilters) {
  return cases.filter(
    (c) =>
      (!filters.category || c.category === filters.category) &&
      (filters.view === "all" || isFlagged(c))
  );
}

export function caseQuery(filters: CaseFilters, patch: Partial<CaseFilters> = {}) {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams({ from: next.from, to: next.to });
  if (next.category) params.set("category", next.category);
  if (next.view === "flagged") params.set("view", "flagged");
  return params.toString();
}
