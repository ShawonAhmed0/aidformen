export const PASSWORD_MIN_LENGTH = 8;
export const RECOVERY_SESSION_COOKIE = "afm-password-recovery";
export const RECOVERY_SESSION_MAX_AGE_SECONDS = 15 * 60;

/**
 * @param {string} value
 * @returns {string}
 */
export function normalizeRecoveryEmail(value) {
  return value.trim().toLowerCase();
}

/**
 * @param {string} value
 * @returns {"required" | "invalid" | null}
 */
export function validateRecoveryEmail(value) {
  const email = normalizeRecoveryEmail(value);

  if (!email) return "required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "invalid";

  return null;
}

/**
 * @param {string} password
 * @param {string} confirmation
 * @returns {"required" | "too-short" | "mismatch" | null}
 */
export function validateNewPassword(password, confirmation) {
  if (!password || !confirmation) return "required";
  if (password.length < PASSWORD_MIN_LENGTH) return "too-short";
  if (password !== confirmation) return "mismatch";

  return null;
}

/**
 * @param {import("../i18n/config").Locale} locale
 * @returns {string}
 */
export function recoveryCallbackPath(locale) {
  return `/${locale}/auth/callback`;
}

/**
 * @param {import("../i18n/config").Locale} locale
 * @returns {string}
 */
export function resetPasswordPath(locale) {
  return `/${locale}/reset-password`;
}

/**
 * @param {import("../i18n/config").Locale} locale
 * @returns {string}
 */
export function invalidResetPasswordPath(locale) {
  return `${resetPasswordPath(locale)}?error=invalid_link`;
}

/**
 * @param {string} origin
 * @param {import("../i18n/config").Locale} locale
 * @returns {string}
 */
export function recoveryCallbackUrl(origin, locale) {
  return new URL(recoveryCallbackPath(locale), origin).toString();
}

/**
 * The marker is tied to the user established by the one-time recovery code.
 * A later login for another account must never inherit recovery privileges.
 *
 * @param {string | undefined} marker
 * @param {string | undefined} userId
 * @returns {boolean}
 */
export function isRecoverySessionForUser(marker, userId) {
  return Boolean(marker && userId && marker === userId);
}

/**
 * Keep the provider-specific response-shape check in one testable place.
 *
 * @param {{ session?: unknown; user?: unknown; redirectType?: string | null } | null | undefined} data
 * @param {unknown} error
 * @returns {boolean}
 */
export function isSuccessfulRecoveryExchange(data, error) {
  return Boolean(
    !error &&
      data?.session &&
      data?.user &&
      data?.redirectType === "recovery",
  );
}
