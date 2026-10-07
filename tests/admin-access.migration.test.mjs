import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../supabase/migrations/0011_admin_access.sql",
  import.meta.url,
);
const migration = await readFile(migrationUrl, "utf8");

test("admin grant RPC is security-definer, permission-scoped, and manager-gated", () => {
  assert.match(
    migration,
    /drop function if exists public\.promote_admin_by_email\(text\)/i,
  );
  assert.match(
    migration,
    /create or replace function public\.promote_admin_by_email\(\s*target_user_id uuid,\s*target_email text\s*\)[\s\S]*?security definer[\s\S]*?set search_path = ''/i,
  );
  assert.match(migration, /not public\.can_manage_admins\(\)/i);
  assert.match(
    migration,
    /revoke all on function public\.promote_admin_by_email\(uuid, text\) from public/i,
  );
  assert.match(
    migration,
    /revoke all on function public\.promote_admin_by_email\(uuid, text\) from anon/i,
  );
  assert.match(
    migration,
    /grant execute on function public\.promote_admin_by_email\(uuid, text\) to authenticated/i,
  );
});

test("profile trigger protects signup and direct-update privilege fields", () => {
  assert.match(
    migration,
    /before insert or update on public\.profiles/i,
  );
  assert.match(migration, /new\.role := 'member'/i);
  assert.match(migration, /new\.status := 'pending'/i);
  assert.match(migration, /new\.can_manage_admins := false/i);
  assert.match(migration, /errcode = '42501'/i);
  assert.match(
    migration,
    /new\.can_manage_admins is distinct from old\.can_manage_admins[\s\S]*?and not trusted_backend then/i,
  );
  assert.match(
    migration,
    /if not trusted_backend then\s+new\.role := 'member';\s+new\.can_manage_admins := false;/i,
  );
  assert.match(
    migration,
    /new\.role is distinct from old\.role[\s\S]*?and not audited_admin_grant then/i,
  );
});

test("rerunning the migration cannot elevate administrators promoted later", () => {
  assert.match(
    migration,
    /if not exists \([\s\S]*?column_name = 'can_manage_admins'[\s\S]*?add column can_manage_admins[\s\S]*?update public\.profiles[\s\S]*?set can_manage_admins = true[\s\S]*?end if/i,
  );
  assert.doesNotMatch(
    migration,
    /add column if not exists can_manage_admins[\s\S]*?update public\.profiles/i,
  );
});

test("promotion uses fixed privilege values and records an audit event", () => {
  assert.match(
    migration,
    /where u\.id = target_user_id\s+and lower\(u\.email\) = normalized_email\s+and u\.email_confirmed_at is not null\s+and u\.deleted_at is null/i,
  );
  assert.match(
    migration,
    /perform pg_catalog\.set_config\('app\.admin_access_grant', 'true', true\)/i,
  );
  assert.match(
    migration,
    /update public\.profiles[\s\S]*?perform pg_catalog\.set_config\('app\.admin_access_grant', 'false', true\)[\s\S]*?insert into public\.admin_access_audit/i,
  );
  assert.match(
    migration,
    /set role = 'admin',[\s\S]*?can_manage_admins = false,[\s\S]*?status = 'approved'/i,
  );
  assert.match(
    migration,
    /insert into public\.admin_access_audit \(actor_id, target_user_id, action\)/i,
  );
  assert.doesNotMatch(migration, /service_role_key/i);
});

test("account review and administrator listing stay manager-only", () => {
  for (const signature of [
    "public.lookup_admin_candidate(text)",
    "public.list_admin_accounts()",
  ]) {
    const escaped = signature.replace(/[().]/g, "\\$&");
    assert.match(migration, new RegExp(`revoke all on function ${escaped} from public`, "i"));
    assert.match(migration, new RegExp(`revoke all on function ${escaped} from anon`, "i"));
    assert.match(
      migration,
      new RegExp(`grant execute on function ${escaped} to authenticated`, "i"),
    );
  }

  assert.match(
    migration,
    /lookup_admin_candidate\(target_email text\)[\s\S]*?u\.email_confirmed_at is not null[\s\S]*?u\.deleted_at is null[\s\S]*?u\.banned_until is null or u\.banned_until <= now\(\)/i,
  );
  assert.match(
    migration,
    /list_admin_accounts\(\)[\s\S]*?u\.email_confirmed_at is not null[\s\S]*?u\.deleted_at is null/i,
  );
});

test("audit rows retain immutable identities without blocking auth-user deletion", () => {
  assert.match(migration, /actor_id\s+uuid not null/i);
  assert.match(migration, /target_user_id\s+uuid not null/i);
  assert.doesNotMatch(
    migration,
    /(?:actor_id|target_user_id)\s+uuid references auth\.users/i,
  );
});
