import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const postCard = await readFile(
  new URL("../components/forum/PostCard.tsx", import.meta.url),
  "utf8",
);
const forumActions = await readFile(
  new URL("../lib/actions/forum.ts", import.meta.url),
  "utf8",
);
const forumContent = await readFile(
  new URL("../lib/content/forum.ts", import.meta.url),
  "utf8",
);

test("deleting from a forum detail view returns the reader to the forum", () => {
  assert.match(postCard, /redirectAfter=\{detail\}/);
});

test("forum post removal is an auditable soft delete with a no-op guard", () => {
  assert.match(
    forumActions,
    /from\(["']forum_posts["']\)[\s\S]*?update\(\{\s*is_removed:\s*true\s*\},/,
  );
  assert.match(forumActions, /update\(\{\s*is_removed:\s*true\s*\},\s*\{\s*count:\s*["']exact["']/);
  assert.match(forumActions, /if \(count !== 1\) return fail/);
  assert.doesNotMatch(
    forumActions,
    /from\(["']forum_posts["']\)\.delete\(\)/,
  );
});

test("removed forum posts are excluded from feed and detail reads", () => {
  const filters = forumContent.match(/\.eq\(["']is_removed["'],\s*false\)/g) ?? [];
  assert.ok(filters.length >= 2);
});
