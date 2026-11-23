import { createClient } from "@/lib/supabase/server";
import {
  chatCategories,
  isFlagged,
  occupationGroups,
  type ChatCase,
  type ChatCategoryId,
  type OccupationGroupId,
} from "@/lib/types/chatbot";
import { dhakaDay } from "./chat-cases";

/**
 * Figures for the Reports page, the AI range summaries and the Excel export.
 * Every count here leaves out chats flagged as fake (an admin's verdict wins
 * over the AI's), so a burst of spam cannot pass for a trend.
 */

export const ageBands = [
  { id: "under_18", min: 10, max: 17, bn: "১৮-এর কম", en: "Under 18" },
  { id: "18_24", min: 18, max: 24, bn: "১৮–২৪", en: "18–24" },
  { id: "25_34", min: 25, max: 34, bn: "২৫–৩৪", en: "25–34" },
  { id: "35_44", min: 35, max: 44, bn: "৩৫–৪৪", en: "35–44" },
  { id: "45_54", min: 45, max: 54, bn: "৪৫–৫৪", en: "45–54" },
  { id: "55_plus", min: 55, max: 120, bn: "৫৫+", en: "55+" },
  { id: "unknown", min: -1, max: -1, bn: "জানা নেই", en: "Not stated" },
] as const;

export type AgeBandId = (typeof ageBands)[number]["id"];

export function ageBand(age: number | null): AgeBandId {
  if (age === null) return "unknown";
  return ageBands.find((b) => age >= b.min && age <= b.max)?.id ?? "unknown";
}

/** Rows of a category table: the eight categories, then "not clear yet". */
export const categoryRows: (ChatCategoryId | null)[] = [
  ...chatCategories.map((c) => c.id),
  null,
];

export type Breakdown = {
  /** Counted chats: everything not flagged. */
  total: number;
  /** Different phone numbers among them (unverified, so not proven people). */
  people: number;
  flagged: number;
  byCategory: Map<ChatCategoryId | null, number>;
  byAge: Map<AgeBandId, number>;
  byOccupation: Map<OccupationGroupId, number>;
  /** category → age band → count */
  categoryByAge: Map<ChatCategoryId | null, Map<AgeBandId, number>>;
  /** category → occupation group → count */
  categoryByOccupation: Map<ChatCategoryId | null, Map<OccupationGroupId, number>>;
};

function bump<K>(map: Map<K, number>, key: K) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function bump2<A, B>(map: Map<A, Map<B, number>>, a: A, b: B) {
  const inner = map.get(a) ?? new Map<B, number>();
  bump(inner, b);
  map.set(a, inner);
}

export function counted(cases: ChatCase[]) {
  return cases.filter((c) => !isFlagged(c));
}

export function breakdown(cases: ChatCase[]): Breakdown {
  const genuine = counted(cases);
  const result: Breakdown = {
    total: genuine.length,
    people: new Set(genuine.map((c) => c.phone)).size,
    flagged: cases.length - genuine.length,
    byCategory: new Map(),
    byAge: new Map(),
    byOccupation: new Map(),
    categoryByAge: new Map(),
    categoryByOccupation: new Map(),
  };

  for (const c of genuine) {
    const band = ageBand(c.age);
    const occupation: OccupationGroupId = c.occupation_group ?? "unknown";
    bump(result.byCategory, c.category);
    bump(result.byAge, band);
    bump(result.byOccupation, occupation);
    bump2(result.categoryByAge, c.category, band);
    bump2(result.categoryByOccupation, c.category, occupation);
  }

  return result;
}

export type YearSeries = {
  /** Counted chats per month, January first. */
  chats: number[];
  /** Different numbers reached from 1 January up to the end of each month. */
  cumulativePeople: number[];
  /** category → counted chats per month */
  categoryByMonth: Map<ChatCategoryId | null, number[]>;
};

export function yearSeries(cases: ChatCase[]): YearSeries {
  const genuine = counted(cases).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const chats = Array<number>(12).fill(0);
  const newPeople = Array<number>(12).fill(0);
  const categoryByMonth = new Map<ChatCategoryId | null, number[]>();
  const seen = new Set<string>();

  for (const c of genuine) {
    const month = Number(dhakaDay(new Date(c.created_at)).slice(5, 7)) - 1;
    chats[month] += 1;
    if (!seen.has(c.phone)) {
      seen.add(c.phone);
      newPeople[month] += 1;
    }
    const row = categoryByMonth.get(c.category) ?? Array<number>(12).fill(0);
    row[month] += 1;
    categoryByMonth.set(c.category, row);
  }

  let running = 0;
  const cumulativePeople = newPeople.map((n) => (running += n));
  return { chats, cumulativePeople, categoryByMonth };
}

/** Documents visitors sent in a range; null until migration 0021 has run. */
export async function countDocuments(from: string, to: string): Promise<number | null> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("chat_documents")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${from}T00:00:00+06:00`)
    .lte("created_at", `${to}T23:59:59.999+06:00`);
  if (error) return null;
  return count ?? 0;
}

export type RangeSummary = {
  summary_bn: string;
  summary_en: string;
  chat_count: number;
  generated_at: string;
};

/** The cached AI summary of exactly this range, if one has been written. */
export async function getRangeSummary(from: string, to: string): Promise<RangeSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_range_summaries")
    .select("summary_bn, summary_en, chat_count, generated_at")
    .eq("range_from", from)
    .eq("range_to", to)
    .maybeSingle();
  if (error) return null;
  return (data as RangeSummary | null) ?? null;
}

export const occupationRows: OccupationGroupId[] = occupationGroups.map((g) => g.id);
