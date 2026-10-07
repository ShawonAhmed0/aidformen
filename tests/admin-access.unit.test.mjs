import assert from "node:assert/strict";
import test from "node:test";

import {
  ADMIN_EMAIL_MAX_LENGTH,
  isAdminUserId,
  normalizeAdminEmail,
  runAdminPromotion,
  validateAdminEmail,
} from "../lib/auth/admin-access.mjs";

const VALID_USER_ID = "123e4567-e89b-12d3-a456-426614174000";

test("administrator email validation rejects blank, malformed, non-string, and oversized input", () => {
  assert.equal(validateAdminEmail(""), "required");
  assert.equal(validateAdminEmail("not-an-email"), "invalid");
  assert.equal(validateAdminEmail({ name: "email.txt" }), "invalid");
  assert.equal(
    validateAdminEmail(`${"a".repeat(ADMIN_EMAIL_MAX_LENGTH)}@example.com`),
    "invalid",
  );
});

test("administrator email normalization trims and lowercases", () => {
  assert.equal(
    normalizeAdminEmail("  New.Admin+Access@Example.COM "),
    "new.admin+access@example.com",
  );
  assert.equal(validateAdminEmail("New.Admin+Access@Example.COM"), null);
});

test("reviewed account ids must be UUIDs", () => {
  assert.equal(isAdminUserId(VALID_USER_ID), true);
  assert.equal(isAdminUserId("not-a-uuid"), false);
  assert.equal(isAdminUserId("'; drop table profiles; --"), false);
  assert.equal(isAdminUserId(null), false);
});

test("unauthorized callers never reach the promotion operation", async () => {
  let calls = 0;
  const result = await runAdminPromotion(
    { email: "person@example.com", userId: VALID_USER_ID },
    {
      authorized: false,
      promote: async () => {
        calls += 1;
        return "promoted";
      },
    },
  );

  assert.deepEqual(result, { ok: false, code: "unauthorized" });
  assert.equal(calls, 0);
});

test("invalid and injection-shaped input never reaches the promotion operation", async () => {
  let calls = 0;
  const promote = async () => {
    calls += 1;
    return "promoted";
  };

  assert.deepEqual(
    await runAdminPromotion(
      {
        email: "x@example.com'); drop table profiles; --",
        userId: VALID_USER_ID,
      },
      {
        authorized: true,
        promote,
      },
    ),
    { ok: false, code: "invalid" },
  );
  assert.deepEqual(
    await runAdminPromotion(
      { email: "person@example.com", userId: "not-a-uuid" },
      { authorized: true, promote },
    ),
    { ok: false, code: "invalid" },
  );
  assert.equal(calls, 0);
});

test("unknown accounts, existing administrators, and successful promotions are distinct", async () => {
  assert.deepEqual(
    await runAdminPromotion(
      { email: "missing@example.com", userId: VALID_USER_ID },
      {
        authorized: true,
        promote: async () => "not_found",
      },
    ),
    { ok: false, code: "not_found" },
  );

  assert.deepEqual(
    await runAdminPromotion(
      { email: "admin@example.com", userId: VALID_USER_ID },
      {
        authorized: true,
        promote: async () => "already_admin",
      },
    ),
    { ok: true, status: "already_admin" },
  );

  let receivedEmail = "";
  let receivedUserId = "";
  assert.deepEqual(
    await runAdminPromotion(
      { email: "  MEMBER@Example.COM ", userId: VALID_USER_ID },
      {
        authorized: true,
        promote: async (email, userId) => {
          receivedEmail = email;
          receivedUserId = userId;
          return "promoted";
        },
      },
    ),
    { ok: true, status: "promoted" },
  );
  assert.equal(receivedEmail, "member@example.com");
  assert.equal(receivedUserId, VALID_USER_ID);
});

test("unexpected database outcomes and thrown errors become one safe failure code", async () => {
  assert.deepEqual(
    await runAdminPromotion(
      { email: "person@example.com", userId: VALID_USER_ID },
      {
        authorized: true,
        promote: async () => ({ secret: "must not cross the boundary" }),
      },
    ),
    { ok: false, code: "failed" },
  );

  assert.deepEqual(
    await runAdminPromotion(
      { email: "person@example.com", userId: VALID_USER_ID },
      {
        authorized: true,
        promote: async () => {
          throw new Error("private database details");
        },
      },
    ),
    { ok: false, code: "failed" },
  );
});
