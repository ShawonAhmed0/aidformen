import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

import ts from "typescript";

const migration = await readFile(
  new URL("../supabase/migrations/0013_chat_history.sql", import.meta.url),
  "utf8",
);

test("chat identity and full messages live in private relational tables", () => {
  assert.match(migration, /create table if not exists public\.chat_conversations/i);
  assert.match(migration, /visitor_name\s+text not null/i);
  assert.match(migration, /phone\s+text not null/i);
  assert.match(migration, /summary\s+text/i);
  assert.match(migration, /message_count\s+integer not null/i);
  assert.match(migration, /create table if not exists public\.chat_messages/i);
  assert.match(
    migration,
    /conversation_id\s+uuid not null references public\.chat_conversations \(id\) on delete cascade/i,
  );
  assert.match(migration, /role\s+text not null check \(role in \('user', 'assistant'\)\)/i);
  assert.match(migration, /char_length\(content\) between 1 and 4000/i);
});

test("chat tables expose history only to administrators through RLS", () => {
  for (const table of ["chat_conversations", "chat_messages"]) {
    assert.match(
      migration,
      new RegExp(`alter table public\\.${table} enable row level security`, "i"),
    );
    assert.match(
      migration,
      new RegExp(`${table}_admin_read[\\s\\S]*?for select using \\(public\\.is_admin\\(\\)\\)`, "i"),
    );
  }

  assert.doesNotMatch(
    migration,
    /create policy[\s\S]{0,180}?on public\.chat_(?:conversations|messages)[\s\S]{0,180}?using \(true\)/i,
  );
  const tableGrantStatements = migration
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) =>
      /grant\s+(?:select|insert|update|delete|all)[\s\S]*?on\s+(?:table\s+)?public\.chat_(?:conversations|messages)/i.test(
        statement,
      ),
    );
  for (const statement of tableGrantStatements) {
    assert.doesNotMatch(statement, /\bto\s+anon\b/i);
  }
});

test("public RPCs are narrowly granted and keep session tokens server-side", () => {
  for (const signature of [
    "public.start_chat_conversation(text, text, text)",
    "public.append_chat_exchange(uuid, uuid, text, text)",
  ]) {
    const escaped = signature.replace(/[().]/g, "\\$&");
    assert.match(
      migration,
      new RegExp(`revoke all on function ${escaped} from public`, "i"),
    );
    assert.match(
      migration,
      new RegExp(`grant execute on function ${escaped}[\\s\\S]*?to anon, authenticated`, "i"),
    );
  }

  assert.match(
    migration,
    /append_chat_exchange[\s\S]*?where id = p_conversation_id and access_token = p_conversation_token[\s\S]*?for update/i,
  );
  assert.match(migration, /if not found or v_count > 98 then\s+return false/i);
  assert.match(migration, /char_length\(v_user\) < 1 or char_length\(v_user\) > 1000/i);
  assert.match(migration, /char_length\(v_assistant\) < 1 or char_length\(v_assistant\) > 4000/i);
});

test("chat intake enforces name bounds, an 11-digit Bangladesh number, and retention", () => {
  assert.match(
    migration,
    /char_length\(v_name\) < 2 or char_length\(v_name\) > 100/i,
  );
  assert.match(migration, /\^01\[3-9\]\[0-9\]\{8\}\$/i);
  assert.match(
    migration,
    /history_retention_days between 7 and 365/i,
  );
  assert.match(
    migration,
    /updated_at < now\(\) - make_interval\(days => coalesce\(v_retention, 90\)\)/i,
  );
});

test("conversation summary rolls up recent visitor questions without another AI call", () => {
  assert.match(
    migration,
    /select string_agg\(recent\.snippet, ' • ' order by recent\.id\)/i,
  );
  assert.match(
    migration,
    /where conversation_id = p_conversation_id and role = 'user'[\s\S]*?order by id desc[\s\S]*?limit 4/i,
  );
  assert.match(migration, /summary = v_summary/i);
});

test("shared phone helpers accept Bengali digits but keep one canonical format", async () => {
  const source = await readFile(
    new URL("../lib/types/chatbot.ts", import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const cjsModule = { exports: {} };
  vm.runInNewContext(outputText, {
    module: cjsModule,
    exports: cjsModule.exports,
    require(specifier) {
      throw new Error(`Unexpected chatbot type import: ${specifier}`);
    },
  });

  const { normalizeBangladeshPhone, isValidBangladeshPhone } = cjsModule.exports;
  assert.equal(normalizeBangladeshPhone(" ০১৭১২-৩৪৫ ৬৭৮ "), "01712345678");
  assert.equal(isValidBangladeshPhone("01712345678"), true);
  assert.equal(isValidBangladeshPhone("০১৮১২৩৪৫৬৭৮"), true);

  for (const value of [
    "1712345678",
    "+8801712345678",
    "01212345678",
    "0171234567",
    "017123456789",
    "01712<script>",
  ]) {
    assert.equal(isValidBangladeshPhone(value), false, value);
  }
});
