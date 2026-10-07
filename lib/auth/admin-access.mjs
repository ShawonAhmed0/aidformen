export const ADMIN_EMAIL_MAX_LENGTH = 254;

/**
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeAdminEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * @param {unknown} value
 * @returns {"required" | "invalid" | null}
 */
export function validateAdminEmail(value) {
  if (typeof value !== "string") return "invalid";

  const email = normalizeAdminEmail(value);
  if (!email) return "required";
  if (email.length > ADMIN_EMAIL_MAX_LENGTH) return "invalid";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "invalid";

  return null;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isAdminUserId(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

const rpcOutcomes = new Set(["promoted", "already_admin", "not_found"]);

/**
 * Testable core for the Server Action. The caller supplies the authorization
 * result and the one narrow database operation; arbitrary role data never
 * crosses this boundary.
 *
 * @param {{ email: unknown, userId: unknown }} candidate
 * @param {{ authorized: boolean, promote: (email: string, userId: string) => Promise<unknown> }} dependencies
 * @returns {Promise<
 *   | { ok: true, status: "promoted" | "already_admin" }
 *   | { ok: false, code: "unauthorized" | "required" | "invalid" | "not_found" | "failed" }
 * >}
 */
export async function runAdminPromotion(candidate, { authorized, promote }) {
  if (!authorized) return { ok: false, code: "unauthorized" };

  const validation = validateAdminEmail(candidate?.email);
  if (validation) return { ok: false, code: validation };
  if (!isAdminUserId(candidate?.userId)) return { ok: false, code: "invalid" };

  try {
    const outcome = await promote(
      normalizeAdminEmail(candidate.email),
      candidate.userId,
    );

    if (!rpcOutcomes.has(outcome)) return { ok: false, code: "failed" };
    if (outcome === "not_found") return { ok: false, code: "not_found" };

    return { ok: true, status: outcome };
  } catch {
    return { ok: false, code: "failed" };
  }
}
