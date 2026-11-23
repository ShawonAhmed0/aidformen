import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";
import { checkBotId } from "botid/server";

/**
 * The checks every public chat endpoint runs before it spends anything.
 *
 * - BotID (Vercel): invisible bot detection. In development the library
 *   always answers "human".
 * - A rate limit counted in the database (chat_rate_allow, migration 0021),
 *   so it holds across every Vercel instance rather than resetting per server
 *   like the in-process limiter in /api/chat. Only a hash of the IP is sent.
 */

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function isBot() {
  try {
    const verdict = await checkBotId();
    return verdict.isBot;
  } catch (error) {
    // A BotID outage must not take the chat down with it.
    console.warn("[chat-guard] BotID check failed:", error);
    return false;
  }
}

/**
 * True when this request is within `limit` per `windowSeconds` for its IP and
 * `scope`. Fails open — allows the request — if the database can't answer,
 * since the in-process limiter and the per-phone cap still stand.
 */
export async function withinSharedLimit(
  supabase: SupabaseClient,
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number
) {
  const key = createHash("sha256").update(`aidformen:${scope}:${clientIp(request)}`).digest("hex");
  const { data, error } = await supabase.rpc("chat_rate_allow", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.warn("[chat-guard] shared limit unavailable:", error.code, error.message);
    return true;
  }
  return data === true;
}
