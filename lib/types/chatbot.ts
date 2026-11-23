/** Row shape for supabase/migrations/0005_chatbot.sql. */
export type ChatbotSettings = {
  id: boolean;
  is_enabled: boolean;
  bot_name: string;
  bot_name_en: string | null;
  greeting: string;
  greeting_en: string | null;
  brief: string | null;
  brief_en: string | null;
  disclaimer: string;
  disclaimer_en: string | null;
  model: string;
  max_turns: number;
  /** Days before a chat is deleted; null keeps chats indefinitely. */
  history_retention_days: number | null;
};

/** Private admin-only history row. The per-session token never leaves the API. */
export type ChatConversation = {
  id: string;
  visitor_name: string;
  phone: string;
  locale: "bn" | "en";
  summary: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
  messages: ChatHistoryMessage[];
};

export type ChatHistoryMessage = {
  id: number;
  role: ChatRole;
  content: string;
  created_at: string;
};

export type ChatSessionCredentials = {
  id: string;
  token: string;
};

/**
 * Models offered in the admin dropdown.
 *
 * The request shape is not the same for all of them, which is why this is a
 * table rather than a list of strings:
 *
 *  - `effort` is rejected outright by Haiku 4.5, so it must not be sent there.
 *  - Thinking is ON by default on Sonnet 5 and Opus 5 and shares the max_tokens
 *    budget with the reply; on Haiku it is off unless asked for. For a grounded
 *    FAQ bot there is nothing to reason about, so it is turned off wherever
 *    turning it off is supported — that is the single biggest token saving.
 *  - Prompt caching has a per-model minimum prefix. Below it the brief silently
 *    will not cache: no error, no saving.
 *
 * Prices are per million tokens, for the admin's benefit only.
 */
export const chatModels = [
  {
    id: "claude-haiku-4-5",
    label: "Haiku 4.5 — সবচেয়ে সাশ্রয়ী",
    labelEn: "Haiku 4.5 — most economical",
    price: "$1 / $5",
    supportsEffort: false,
    // Omitted rather than "disabled": this generation has no thinking unless
    // asked, and it does not take the newer disabled form.
    thinking: "omit",
    cacheMinTokens: 4096,
  },
  {
    id: "claude-sonnet-5",
    label: "Sonnet 5 — ভারসাম্যপূর্ণ",
    labelEn: "Sonnet 5 — balanced",
    price: "$3 / $15",
    supportsEffort: true,
    thinking: "disabled",
    cacheMinTokens: 1024,
  },
  {
    id: "claude-opus-5",
    label: "Opus 5 — সবচেয়ে সক্ষম",
    labelEn: "Opus 5 — most capable",
    price: "$5 / $25",
    supportsEffort: true,
    thinking: "disabled",
    cacheMinTokens: 512,
  },
] as const;

export type ChatModelId = (typeof chatModels)[number]["id"];

/** Cheapest of the three, and ample for answering from a short brief. */
export const DEFAULT_CHAT_MODEL: ChatModelId = "claude-haiku-4-5";

/**
 * Config for a stored model id.
 *
 * Returns null for anything not in the table — a model released after this was
 * written, typed in by hand. The caller then sends only the parameters every
 * model accepts, so a newer model still works instead of 400-ing on a flag it
 * has never heard of.
 */
export function chatModelConfig(id: string) {
  return chatModels.find((m) => m.id === id) ?? null;
}

/** Only these two roles cross the wire; the system prompt is built server-side. */
export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export const MAX_MESSAGE_CHARS = 1000;

/**
 * Accept Bengali numerals in the visitor form, then validate one canonical
 * Bangladesh mobile format everywhere else.
 */
export function normalizeBangladeshPhone(value: string): string {
  const bengaliDigits = "০১২৩৪৫৬৭৮৯";

  return value
    .trim()
    .replace(/[০-৯]/g, (digit) => String(bengaliDigits.indexOf(digit)))
    .replace(/[\s()-]/g, "");
}

export function isValidBangladeshPhone(value: string): boolean {
  return /^01[3-9][0-9]{8}$/.test(normalizeBangladeshPhone(value));
}

// ---------------------------------------------------------------------------
// Intake: what each conversation is about, as Claude reads it
// ---------------------------------------------------------------------------

/**
 * Problem categories the tagger sorts conversations into (lib/chat/tagging.ts),
 * in the order the admin lists them. The ids are stored, so never rename one;
 * they must match public.chat_category_ids() in migration 0020 — add a new
 * one to both, and describe it in the tagger's prompt.
 */
export const chatCategories = [
  { id: "dowry_case", bn: "যৌতুক মামলা", en: "Dowry case" },
  {
    id: "women_repression_case",
    bn: "নারী ও শিশু নির্যাতন মামলা",
    en: "Women and children repression case",
  },
  { id: "domestic_violence", bn: "পারিবারিক সহিংসতা", en: "Domestic violence" },
  {
    id: "marriage_promise_case",
    bn: "বিয়ের প্রলোভনে ধর্ষণ বা প্রতারণার মামলা",
    en: "Rape or fraud case over a promise of marriage",
  },
  { id: "false_case", bn: "মিথ্যা মামলা", en: "False case" },
  {
    id: "family_dispute",
    bn: "পারিবারিক বা দাম্পত্য বিরোধ",
    en: "Family or marital dispute",
  },
  { id: "other_issue", bn: "পুরুষদের অন্য কোনো সমস্যা", en: "Another men's issue" },
  // Kept apart so questions about donating or volunteering don't inflate a
  // problem count.
  {
    id: "general_info",
    bn: "ফাউন্ডেশন সম্পর্কে জানতে চাই",
    en: "A question about the foundation",
  },
] as const;

export type ChatCategoryId = (typeof chatCategories)[number]["id"];

export function isChatCategory(value: unknown): value is ChatCategoryId {
  return chatCategories.some((category) => category.id === value);
}

export function chatCategoryLabel(id: string | null, locale: "bn" | "en") {
  const category = chatCategories.find((c) => c.id === id);
  return category ? category[locale] : null;
}

/**
 * Occupation buckets the tagger sorts free-text answers into, so "ব্যবসা",
 * "ব্যবসায়ী" and "business" count as one. Must match
 * public.chat_occupation_group_ids() in migration 0020.
 */
export const occupationGroups = [
  { id: "student", bn: "শিক্ষার্থী", en: "Student" },
  { id: "private_job", bn: "বেসরকারি চাকরি", en: "Private job" },
  { id: "government_job", bn: "সরকারি চাকরি", en: "Government job" },
  { id: "business", bn: "ব্যবসা", en: "Business" },
  { id: "farmer", bn: "কৃষি", en: "Farming" },
  { id: "worker", bn: "শ্রমিক বা দিনমজুর", en: "Worker or day labourer" },
  { id: "expatriate", bn: "প্রবাসী", en: "Working abroad" },
  { id: "unemployed", bn: "বেকার", en: "Unemployed" },
  { id: "other", bn: "অন্যান্য", en: "Other" },
  { id: "unknown", bn: "জানা নেই", en: "Not stated" },
] as const;

export type OccupationGroupId = (typeof occupationGroups)[number]["id"];

export function occupationGroupLabel(id: string | null, locale: "bn" | "en") {
  const group = occupationGroups.find((g) => g.id === id);
  return group ? group[locale] : null;
}

/** One conversation as the admin Problem feed sees it (migration 0020). */
export type ChatCase = {
  id: string;
  visitor_name: string;
  phone: string;
  locale: "bn" | "en";
  /** Claude's reading. Null until the visitor has said what the problem is. */
  category: ChatCategoryId | null;
  age: number | null;
  occupation: string | null;
  occupation_group: OccupationGroupId | null;
  ai_summary: string | null;
  ai_summary_en: string | null;
  /** The old deterministic summary: the visitor's latest questions. */
  summary: string | null;
  is_suspicious: boolean;
  suspicious_reason: string | null;
  suspicious_override: boolean | null;
  tagged_at: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
};

/** The admin's verdict wins over Claude's flag. */
export function isFlagged(c: Pick<ChatCase, "is_suspicious" | "suspicious_override">) {
  return c.suspicious_override ?? c.is_suspicious;
}
