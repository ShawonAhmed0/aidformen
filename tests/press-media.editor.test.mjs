import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

import ts from "typescript";

const [
  editor,
  sanitizer,
  urlsSource,
  actions,
  renderer,
  card,
  detail,
  css,
  packageSource,
] = await Promise.all([
  readFile(new URL("../components/admin/EditorialTextField.tsx", import.meta.url), "utf8"),
  readFile(new URL("../lib/editorial/sanitize.ts", import.meta.url), "utf8"),
  readFile(new URL("../lib/editorial/urls.ts", import.meta.url), "utf8"),
  readFile(new URL("../lib/actions/archive.ts", import.meta.url), "utf8"),
  readFile(new URL("../components/content/EditorialContent.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/archive/ArchiveCard.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/(public)/[lang]/news/[slug]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8"),
]);

test("the admin uses a licensed Quill 2 editor with full toolbar coverage", () => {
  const pkg = JSON.parse(packageSource);
  assert.match(pkg.dependencies.quill, /^\^2\./);
  assert.ok(pkg.dependencies["quill-table-better"]);
  assert.ok(pkg.dependencies["quill-resize-module"]);
  assert.ok(pkg.dependencies["sanitize-html"]);

  for (const control of [
    "ql-font",
    "ql-size",
    "ql-header",
    "ql-bold",
    "ql-italic",
    "ql-underline",
    "ql-strike",
    "ql-script",
    "ql-color",
    "ql-background",
    "ql-align",
    "ql-list",
    "ql-indent",
    "ql-link",
    "ql-image",
    "ql-video",
    "ql-table-better",
  ]) {
    assert.match(editor, new RegExp(control.replace("-", "\\-")), control);
  }

  assert.match(editor, /history\.undo\(\)/);
  assert.match(editor, /history\.redo\(\)/);
  assert.match(editor, /removeFormat\(/);
  assert.match(editor, /toggleSource/);
  assert.match(editor, /setFullscreen/);
});

test("image upload, semantic HTML, tables and resize changes are persisted", () => {
  assert.match(editor, /uploadToMedia\(file,\s*["']archive["']\)/);
  assert.match(editor, /safeEditorialUrl\(raw\)/);
  assert.match(editor, /safeVideoEmbedUrl\(raw\)/);
  assert.match(editor, /getSemanticHTML\(\)/);
  assert.match(editor, /formatText\(index, 1, ["']alt["']/);
  assert.match(editor, /onChangeSize:\s*\(\)\s*=>\s*emit\(editorHtml\(quill\)\)/);
  assert.match(editor, /onInactive:\s*\(\)\s*=>\s*emit\(editorHtml\(quill\)\)/);
  assert.match(editor, /source !== ["']silent["']/);
  assert.match(editor, /event\.key === ["']Escape["']/);
  assert.match(editor, /aria-hidden=\{sourceMode \|\| undefined\}/);
  assert.match(editor, /\(!ready \|\| sourceMode\) && ["']hidden["']/);
  assert.match(editor, /emit\(clientSanitizerRef\.current\(next\)\)/);
  assert.match(editor, /catch\s*\{/);
  assert.match(editor, /disabled=\{uploading\}/);
  assert.match(editor, /langRef\.current !== uploadLanguage/);
});

test("all long-form fields cross the server sanitizer before persistence", () => {
  assert.match(actions, /legacyMarkdownToHtml\(value\)/);
  assert.match(actions, /sanitizeOptionalEditorialHtml/);
  for (const field of [
    "body",
    "body_en",
    "notice_body",
    "notice_body_en",
    "post_event_body",
    "post_event_body_en",
    "press_release_body",
    "press_release_body_en",
  ]) {
    assert.match(
      actions,
      new RegExp(`editorialField\\(\\s*formData,\\s*["']${field}["']`),
      field,
    );
  }
});

test("public HTML is sanitized again and plain-text consumers stay client-safe", () => {
  assert.match(sanitizer, /import ["']server-only["']/);
  assert.match(sanitizer, /allowedIframeHostnames/);
  assert.match(sanitizer, /youtube-nocookie\.com/);
  assert.match(sanitizer, /sandbox:\s*["']allow-scripts allow-same-origin allow-presentation["']/);
  assert.match(sanitizer, /ql-resize-style-/);
  assert.match(sanitizer, /border-style/);
  assert.match(renderer, /sanitizeEditorialHtml\(content\)/);
  assert.match(renderer, /dangerouslySetInnerHTML=\{\{ __html: safeHtml \}\}/);
  assert.match(card, /@\/lib\/editorial\/plain-text/);
  assert.match(detail, /@\/lib\/editorial\/plain-text/);
  assert.doesNotMatch(card, /@\/components\/content\/EditorialContent/);
});

test("editor and public content share Quill and editorial styling", () => {
  assert.match(css, /@import ["']quill\/dist\/quill\.snow\.css["']/);
  assert.match(css, /@import ["']quill-table-better\/dist\/quill-table-better\.css["']/);
  assert.match(css, /@import ["']quill-resize-module\/dist\/resize\.css["']/);
  assert.match(editor, /classList\.add\(["']editorial-rich-content["']\)/);
  assert.match(renderer, /["']editorial-rich-content["']/);
  assert.match(css, /\.editorial-rich-content\s*\{/);
  assert.match(css, /\.editorial-rich-content table\s*\{/);
  assert.match(css, /\.editorial-rich-content \.ql-resize-style-right/);
});

test("editorial URL helpers reject active and path-confusion URLs", () => {
  const { outputText } = ts.transpileModule(urlsSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const cjsModule = { exports: {} };
  vm.runInNewContext(outputText, {
    module: cjsModule,
    exports: cjsModule.exports,
    URL,
  });
  const { safeEditorialUrl, safeVideoEmbedUrl } = cjsModule.exports;

  assert.equal(safeEditorialUrl("/news/item"), "/news/item");
  assert.equal(safeEditorialUrl("/\\evil.example/file"), null);
  assert.equal(safeEditorialUrl("javascript:alert(1)"), null);
  assert.equal(safeEditorialUrl("http://example.com"), null);
  assert.equal(
    safeVideoEmbedUrl("https://youtu.be/dQw4w9WgXcQ"),
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  );
});
