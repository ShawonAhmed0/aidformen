import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

import ts from "typescript";

const source = await readFile(
  new URL("../lib/types/media-library.ts", import.meta.url),
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
  Set,
  Number,
  decodeURIComponent,
});

const {
  formatMediaBytes,
  isBrowserDisplayableImage,
  isBrowserPlayableVideo,
  mediaAssetFileName,
} = cjsModule.exports;

test("only broadly supported image formats are mounted as previews", () => {
  assert.equal(isBrowserDisplayableImage("image/jpeg"), true);
  assert.equal(isBrowserDisplayableImage("IMAGE/AVIF"), true);
  assert.equal(isBrowserDisplayableImage("image/tiff"), false);
  assert.equal(isBrowserDisplayableImage("image/heic"), false);
  assert.equal(isBrowserDisplayableImage("image/svg+xml"), false);
});

test("only browser-safe HTML5 video MIME types are sent to the player", () => {
  assert.equal(isBrowserPlayableVideo("video/mp4"), true);
  assert.equal(isBrowserPlayableVideo("VIDEO/WEBM; codecs=vp9"), true);
  assert.equal(isBrowserPlayableVideo("video/ogg"), true);
  assert.equal(isBrowserPlayableVideo("video/quicktime"), false);
  assert.equal(isBrowserPlayableVideo("text/html"), false);
});

test("storage object names are decoded without throwing on malformed escapes", () => {
  assert.equal(mediaAssetFileName("archive/photo%20one.webp"), "photo one.webp");
  assert.equal(mediaAssetFileName("carousel/banner.jpg"), "banner.jpg");
  assert.equal(mediaAssetFileName("archive/bad%name.jpg"), "bad%name.jpg");
});

test("byte sizes use compact readable units and tolerate missing metadata", () => {
  assert.equal(formatMediaBytes(null), "—");
  assert.equal(formatMediaBytes(0), "0 B");
  assert.equal(formatMediaBytes(1023), "1023 B");
  assert.equal(formatMediaBytes(1024), "1.0 KB");
  assert.equal(formatMediaBytes(12 * 1024), "12 KB");
  assert.equal(formatMediaBytes(1.5 * 1024 * 1024), "1.5 MB");
});
