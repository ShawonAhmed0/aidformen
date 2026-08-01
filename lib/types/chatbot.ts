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
    price: "$3 / $15",
    supportsEffort: true,
    thinking: "disabled",
    cacheMinTokens: 1024,
  },
  {
    id: "claude-opus-5",
    label: "Opus 5 — সবচেয়ে সক্ষম",
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
