import assert from "node:assert/strict";
import test from "node:test";

import {
  invalidResetPasswordPath,
  normalizeRecoveryEmail,
  PASSWORD_MIN_LENGTH,
  recoveryCallbackPath,
  recoveryCallbackUrl,
  resetPasswordPath,
  isRecoverySessionForUser,
  isSuccessfulRecoveryExchange,
  validateNewPassword,
  validateRecoveryEmail,
} from "../lib/auth/recovery.mjs";

test("recovery email validation rejects blank and malformed values", () => {
  assert.equal(validateRecoveryEmail(""), "required");
  assert.equal(validateRecoveryEmail("not-an-email"), "invalid");
  assert.equal(validateRecoveryEmail("person@example.com"), null);
});

test("recovery email normalization trims and lowercases without logging data", () => {
  assert.equal(
    normalizeRecoveryEmail("  Person+Recovery@Example.COM "),
    "person+recovery@example.com",
  );
});

test("recovery destinations are fixed, localized, and same-origin", () => {
  assert.equal(recoveryCallbackPath("en"), "/en/auth/callback");
  assert.equal(resetPasswordPath("en"), "/en/reset-password");
  assert.equal(
    invalidResetPasswordPath("bn"),
    "/bn/reset-password?error=invalid_link",
  );
  assert.equal(
    recoveryCallbackUrl("https://aidformen.com/some/path", "bn"),
    "https://aidformen.com/bn/auth/callback",
  );
});

test("new passwords must be present, strong enough, and matching", () => {
  assert.equal(validateNewPassword("", ""), "required");
  assert.equal(
    validateNewPassword("a".repeat(PASSWORD_MIN_LENGTH - 1), "a".repeat(PASSWORD_MIN_LENGTH - 1)),
    "too-short",
  );
  assert.equal(
    validateNewPassword("a".repeat(PASSWORD_MIN_LENGTH), "b".repeat(PASSWORD_MIN_LENGTH)),
    "mismatch",
  );
  assert.equal(
    validateNewPassword("a".repeat(PASSWORD_MIN_LENGTH), "a".repeat(PASSWORD_MIN_LENGTH)),
    null,
  );
});

test("the recovery marker is bound to the recovered user", () => {
  assert.equal(isRecoverySessionForUser("user-a", "user-a"), true);
  assert.equal(isRecoverySessionForUser("user-a", "user-b"), false);
  assert.equal(isRecoverySessionForUser(undefined, "user-a"), false);
});

test("only a complete password-recovery exchange is accepted", () => {
  const session = { access_token: "test-token" };
  const user = { id: "user-a" };

  assert.equal(
    isSuccessfulRecoveryExchange(
      { session, user, redirectType: "recovery" },
      null,
    ),
    true,
  );
  assert.equal(
    isSuccessfulRecoveryExchange(
      { session, user, redirectType: "signup" },
      null,
    ),
    false,
  );
  assert.equal(
    isSuccessfulRecoveryExchange(
      { session, user, redirectType: "recovery" },
      new Error("exchange failed"),
    ),
    false,
  );
  assert.equal(
    isSuccessfulRecoveryExchange(
      { session: null, user: null, redirectType: null },
      null,
    ),
    false,
  );
});
