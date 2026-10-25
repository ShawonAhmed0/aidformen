import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [hero, slider, home, about, player, migration, action, editor] =
  await Promise.all([
    readFile(new URL("../components/Hero.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/HeroSlider.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/(public)/[lang]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/HomeAboutSection.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/HomeAboutAudioPlayer.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../supabase/migrations/0014_home_about_audio.sql", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../lib/actions/hero.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/HeroEditor.tsx", import.meta.url), "utf8"),
  ]);

test("desktop hero is fold-friendly instead of viewport-height", () => {
  assert.match(hero, /sm:h-\[480px\]/);
  assert.doesNotMatch(hero, /90dvh|100dvh|h-screen|min-h-screen/);
});

test("hero auto-advances and changes the localized slide caption", () => {
  assert.match(slider, /setInterval\([\s\S]*?6000/);
  assert.match(slider, /useReducedMotion\(\)/);
  assert.match(slider, /setPauseOverride\(!paused\)/);
  assert.match(slider, /Pause hero slideshow/);
  assert.match(slider, /Play hero slideshow/);
  assert.match(slider, /pick\(locale, slide\.title, slide\.title_en\)/);
  assert.match(slider, /pick\(locale, slide\.subtitle, slide\.subtitle_en\)/);
  assert.match(slider, /key=\{`caption-\$\{slide\.id\}`\}/);
});

test("homepage puts the audio and About/history columns directly after the hero", () => {
  assert.match(home, /<Hero locale=\{lang\} \/>[\s\S]*?<HomeAboutSection/);
  assert.match(about, /lg:grid-cols-\[minmax\(0,0\.9fr\)_minmax\(0,1\.1fr\)\]/);
  assert.match(about, /<HomeAboutAudioPlayer/);
  assert.match(about, /about\.inception\.paragraphs\[1\]/);
});

test("custom About player provides play, pause, waveform, and seeking", () => {
  assert.match(player, /audioRef\.current/);
  assert.match(player, /<Play/);
  assert.match(player, /<Pause/);
  assert.match(player, /waveform\.map/);
  assert.match(player, /type="range"/);
  assert.match(player, /audio\.currentTime = bounded/);
});

test("About audio is admin-configurable and protected by an HTTPS database constraint", () => {
  assert.match(migration, /add column if not exists about_audio_url text/i);
  assert.match(migration, /about_audio_url ~ '\^https:\/\/'/i);
  assert.match(action, /httpsUrlField\(formData, "about_audio_url"/);
  assert.match(editor, /accept="audio"/);
  assert.match(editor, /folder="audio"/);
});
