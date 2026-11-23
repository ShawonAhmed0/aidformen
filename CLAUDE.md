@AGENTS.md

# Aid For Men Foundation — website

Bilingual (Bengali / English) site for a Bangladeshi non-profit: public pages, a
Media Center and Research & Case Studies section, an admin CMS, and a grounded
chatbot. There is no public sign-up; login exists for staff only. Bengali is the source
language; English is a translation layer that falls back to Bengali.

## Stack

| | |
|---|---|
| Framework | Next.js **16.2.9**, App Router, React 19.2.4, TypeScript |
| Styling | Tailwind **v4** (CSS-first config in `app/globals.css`), shadcn + Base UI primitives |
| Motion | `motion` (Framer) — `motion/react` |
| Data / auth / storage | Supabase (`@supabase/ssr`) |
| Chatbot | `@anthropic-ai/sdk`, model `claude-haiku-4-5` |

**Read `node_modules/next/dist/docs/` before writing Next-specific code.** This
version differs from training data in ways that matter — most visibly, the
middleware file is **`proxy.ts` at the repo root**, not `middleware.ts`, and it
exports `proxy()`.

## Commands

```bash
npm run dev
```

- `npx tsc --noEmit` and `npx eslint .` are the fast checks — run both.
- `npm run build` is slow and has missed runtime-only faults; never rely on it alone.
- **Do not commit, push or build unless asked.** Finish the work and report.

## Layout

```
app/
  (public)/[lang]/…     locale-prefixed public site: /bn/…, /en/…
  (admin)/admin/…       CMS, no locale prefix, admin-only (…/archive, …/team, …)
  api/chat/route.ts     chatbot endpoint (streams text/plain)
  globals.css           the entire design system
  fonts.ts              next/font — Inter (Latin) + Kalpurush/Noto Serif Bengali
components/
  ui/                   shared primitives — Button, Container, Card, Badge, Field…
  admin/  archive/  chat/ feature components
  forms/                Login, Register, Contact
lib/
  actions/              "use server" mutations
  content/              read queries
  i18n/                 config.ts (pick, pickBrand, locales) + dictionary.ts
  supabase/             client.ts (browser) / server.ts (RSC + actions)
  types/                shared row and enum types
supabase/migrations/    numbered .sql, applied by hand in the dashboard
proxy.ts                locale detection/redirect + admin auth gate
```

## Routing and i18n

- `proxy.ts` redirects un-prefixed public paths to a detected locale (cookie →
  `Accept-Language` → `bn`) and stores the choice in `NEXT_LOCALE`. `/admin` and
  `/dashboard` are exempt and carry no prefix.
- Auth runs in the proxy for admin paths **only**, so public pages don't pay for
  a Supabase round trip per request.
- Bilingual DB columns render through `pick(locale, bn, en)` — an empty English
  column means "not translated" and falls back to Bengali.
- The **wordmark** uses `pickBrand()` instead, which falls back to a per-locale
  default rather than to Bengali (otherwise `/en` would show the Bengali name
  forever).
- Internal links built from stored paths must carry the prefix: `/${locale}/contact`.

## Data layer

- `lib/supabase/server.ts` wraps the client in React `cache()` — one client per
  render. Without it each caller re-ran the token refresh (~10 round trips for
  one homepage).
- Cookie writes from Server Components are swallowed on purpose; the proxy is
  what persists sessions, and this client only reads.
- **RLS is the real access control.** Tables: `hero_content`, `carousel_images`,
  `site_settings`, `team_members`, `videos`, `archive_entries` /
  `archive_media`, `newsletter_subscribers`, `profiles`, `chatbot_settings`.
  Public read, admin write. `archive_media` is the
  exception to "public read published rows": it has no `is_published` of its own
  and tests its parent entry's instead.
- **Schema changes ship as a new numbered `.sql` file** in
  `supabase/migrations/`. App code has only the anon key, so DDL never runs
  from the app. Apply one by pasting it into the SQL editor, or — with the
  user's go-ahead, when the Supabase CLI is logged in — with
  `npx supabase db query --remote=<project ref> --file supabase/migrations/<file>.sql --yes`.
  **Never `supabase db push`**: the remote migration history is empty (all
  applied by hand), so it would re-run every migration, including the
  destructive ones. Write them to be safe to re-run. `0017_retire_forum.sql` drops the old forum tables and must be run
  by hand; until it is, those tables just sit unused.

## Archive (Media Center + Research & Case Studies)

`archive_entries` is one row per item, shown in one of two public sections:

| Section (stored id) | Route | Subsection tabs (`?type=`) |
|---|---|---|
| Media Center (`press_media`) | `/[lang]/news` | `news_events` (event + mens_rights_news), `press_release`, `media_coverage` |
| Research & Case Studies (`news_archive`) | `/[lang]/research` | `case_study`, `report` |

- **The content type decides the section** (`sectionForContentType` in
  `lib/types/archive.ts`). The stored `section` column is written from it and
  never trusted on read; the old ids are kept so no CHECK constraint changes.
- Admin mirrors the split: `/admin/archive` is the Media Center and
  `/admin/research` is Research & Case Studies (`ArchiveSectionAdmin`).
- Both routes render `ArchiveSectionPage`; detail pages live at
  `/news/[slug]` and `/research/[slug]` (one implementation, canonical follows
  the entry's section). Kind, category, year and text filters run client-side.

- `resolveArchiveEntry()` in `lib/types/archive.ts` applies the locale on the
  server so the filter component only ever sees display strings.
- An external video link is framed **only** if `toEmbedUrl` (`lib/embed.ts`)
  recognises the host — YouTube and Facebook. Anything
  else is offered as a link out instead of an iframe.
- The homepage "Our recent work" section and the `activities` table are gone;
  migration 0019 drops the table. Recent work is published as archive entries.

### Homepage videos come from YouTube

`MediaSection` reads the channel's public Atom feed (`lib/content/youtube.ts`,
channel id `UCT-h0SZCzed5jHC-Daw1RCQ` = @AIDforMEN) — no API key, cached for an
hour, 4s timeout. Videos play in an in-page `<dialog>` (youtube-nocookie). The
admin `videos` table is now only the fallback when the feed is unreachable.
`i.ytimg.com` is allow-listed in `next.config.ts` for the thumbnails.

### Uploads never go through Server Actions

A Server Action request body is capped at **1MB**, which any real photograph
exceeds. Every admin uploader (`ImagePicker`, `MediaField`, `DocumentPicker`,
the archive editors) uploads **browser-direct to Supabase Storage** via
`lib/supabase/upload.ts`; the `media_admin_insert` storage policy is what
authorises the write. Don't reintroduce a server-side upload action.

Photos are **shrunk in the browser first** (`lib/images/prepare-upload.ts`,
called inside `uploadToMedia`): long edge capped at 2560px, re-encoded as WebP
(JPEG/PNG where Safari can't encode WebP), aspect ratio kept, EXIF — including
GPS — dropped. Editors may pick up to 40 MB; what is stored stays under 8 MB.
Public `next/image` tags only set `unoptimized` for URLs outside our storage
(`isOwnStorageUrl`).

## Admin interface language

The admin has its own বাংলা / EN switch (header), separate from the public
locale: cookie `ADMIN_LOCALE`, default `bn`.

- Client editors: `const t = copy[useAdminLocale()]` (`components/admin/AdminLocale.tsx`)
  with a module-level `copy = { bn: {…}, en: {…} }` beside the component — see
  `AdminHeader.tsx`. Server pages: `await getAdminLocale()`
  (`lib/i18n/admin-server.ts`).
- Every admin string goes in both languages. Error strings returned by server
  actions are still Bengali-only.

- A post lists **several original sources** (`archive_entries.sources`, jsonb
  `[{name, name_en, url}]`, migration 0022). The old `source_name` /
  `source_url` columns are still written from the first one.
- **Image adjuster** (`ImageCropDialog`): drag to position, zoom (slider,
  wheel, pinch, keys), pick 16:9 / 3:2 / 4:3 / 1:1 / original. It produces a
  new cropped file that uploads like any photo, so cropping is destructive —
  re-upload the original to undo. Opens on picking a cover or a single
  gallery photo; every saved image has "Adjust".

`ArchiveManager` (Media Center / Research posts) is deliberately small: the
slug, section and presentation kind are derived on save, and fields it no
longer shows (event notices, press-release text) are carried through untouched
so saving an older entry never erases them.

### AI translation (Bengali → English)

`translateToEnglish()` in `lib/actions/translate.ts` (admin-gated) sends a
keyed object of Bengali strings to **`claude-haiku-5-5`** in one call with a
JSON-schema output, and returns the same keys in English. HTML values keep
their tags and attributes. It shares `ANTHROPIC_API_KEY` with the chatbot.

- Every `BilingualField` / `EditorialTextField` has a "Translate with AI"
  button beside its language tabs (`TranslateButton`); it asks once before
  overwriting English that is already there.
- The post editor (`ArchiveManager`) has "Fill empty English with AI", on by
  default: on save it batch-translates the visible fields whose English is
  blank. A failed translation warns and saves anyway — the site falls back to
  Bengali, so translation must never block publishing.

## Server actions

Every mutation lives in `lib/actions/`, is gated, and returns one shape:

```ts
type ActionResult<T> = { ok: true; data?: T } | { ok: false; error: string }
```

- Gate with `requireAdmin()` (or `requireAdminManager()`) from
  `lib/actions/shared.ts` — defence in depth on top of RLS, and it turns an
  opaque RLS rejection into a message the user can act on.
- Wrap the body in `guarded()` so a `FieldError` becomes `{ ok: false }` instead
  of a crash.
- Read fields with the helpers there (`requiredText`, `optionalText`,
  `hrefField`, `urlField`, `enumField`, …) rather than touching `FormData`
  directly — `hrefField` is also what stops a stored `javascript:` URL reaching
  an `href`.
- Error strings are user-facing Bengali.
- A `"use server"` file may export **only async functions**. A non-function
  export breaks every importer at runtime and `npm run build` does not catch it.

## Design system

`app/globals.css` is three layers: primitives (`@theme`) → semantic (`:root` /
`.dark`) → a bridge that publishes them as Tailwind utilities. Each name is
declared exactly once; duplicating one silently kills the brand colour.

- **Colours only via tokens** — `brand-*`, `ochre-*`, `ink-*`,
  `danger|success|warning` (+ `-soft` / `-line` / `-strong`), or the semantic
  names (`surface`, `surface-sunken`, `foreground`, `border`). **No raw hex in
  components.**
- Type scale is tuned for Bengali: base is **17px** with 1.75 line-height,
  because Bengali sets optically smaller than Latin and matras need vertical
  room. Headings take `font-display`.
- **Focus is styled once globally** (`:focus-visible` in `globals.css`). Never
  add or remove a per-component focus ring.
- Touch targets ≥ 44px — `size="md"` on Button is `h-11`; `lg` is `h-13`.
- Transitions 150–250ms via the `transition-ui` utility.
- Ochre is reserved for the single highest-intent CTA on a view.

### Contrast is load-bearing, not decorative

The hero has no scrim: the frosted panel's `bg-brand-950/70` is the only thing
making its white text legible (6.19:1 heading / 5.71:1 body over a blown-out
photo). Do not lower that alpha to make it "glassier" without re-measuring.
`backdrop-blur` softens the photo but does **not** lower its luminance, so blur
contributes nothing to contrast.

When re-measuring, resolve the colour **through the browser** — composite it
onto a backdrop in a canvas and read the pixel. Tailwind emits `oklab(...)`, and
parsing those components as sRGB gives a confidently wrong answer.

## Chatbot

- `app/api/chat/route.ts` streams plain text. The key (`ANTHROPIC_API_KEY`,
  `.env.local`, gitignored) never leaves the server. Public route, so it is
  size-capped and rate limited (12/min/IP, in-process — a spend guard, not a
  security control).
- The brief is admin-authored at `/admin/chatbot` and injected between explicit
  markers, labelled as data. The model answers **only** from it and refuses
  out-of-scope legal questions.
- Model params differ per model — see `chatModels` in `lib/types/chatbot.ts`.
  Haiku 4.5 **rejects** `effort`. Add new models to that table, not inline.
- Thinking off + Haiku + `max_tokens` 800 + 6-turn history ≈ **$3.52 / 1000
  messages** (Opus 5 with thinking was $21.28). Prompt caching is currently
  inert: the brief is ~1150 tokens, below Haiku's 4096 minimum prefix.
- Replies render through `components/chat/ChatMarkdown.tsx` — a tiny renderer
  for the subset the model emits. React nodes only, never
  `dangerouslySetInnerHTML`.

### Intake and the Problem feed

- Visitors give only name and phone. The **problem category is Claude's
  reading**, never asked: ids live in `chatCategories` (`lib/types/chatbot.ts`)
  and `public.chat_category_ids()` (migration 0020) — add a new one to both
  and describe it in the tagger's prompt. "unclear" is stored as null.
- After each stored exchange, `/api/chat` runs `tagConversation()`
  (`lib/chat/tagging.ts`) inside `after()`: `claude-haiku-5-5` with a JSON
  schema reads the chat and writes the category, age, occupation, a bn/en
  summary and a "looks fake" flag through the token-gated
  `tag_chat_conversation` RPC. It never delays or breaks the reply.
- `/admin/cases` is the Problem feed: Dhaka days, flagged chats left out of
  every count, an admin's `suspicious_override` beats the AI flag, CSV at
  `/admin/cases/export` with the same filters.
- Chats are **kept indefinitely** (`history_retention_days` null, migration
  0021); a number in the Chatbot settings brings automatic deletion back.
- `/admin/reports` is the yearly view: totals, monthly columns, a growth line
  of different numbers, and heat tables of problem type × month / age band /
  occupation (`components/admin/ReportCharts.tsx`, plain SVG/CSS, no library).
- AI summaries of any date range: `summarizeRange()` (`lib/actions/chat-summaries.ts`)
  writes from the figures plus each chat's one-line summary, cached in
  `chat_range_summaries` until the count of chats in the range changes.
  `RangeSummary` writes one automatically when the card mounts.
- Exports: `/admin/cases/export` (CSV, or `?format=xlsx` with breakdown sheets)
  and `/admin/cases/research` (anonymous: per-file IDs, month, age band, no
  summaries, counts under 5 hidden). PDF is the browser's print of the Reports
  page — server PDF libraries don't shape Bengali.
- Chat endpoints run `isBot()` (Vercel BotID, `instrumentation-client.ts`) and
  `withinSharedLimit()` (`lib/chat/guard.ts`, counted in the database across
  servers). `proxy.ts` must keep excluding BotID's `/149e9513-…/` paths.
- Case documents: visitors attach photos (turned into one PDF in the browser)
  or PDFs; they upload browser-direct to the private `case-documents` bucket
  into `<conversation id>/<token>/`, which the storage policy checks, then
  `/api/chat/document` records them. Admins get one-hour signed links in the
  feed. Deleting a conversation row does not delete its files.

## Verifying UI work

Run the dev server through the preview tool and **measure in the browser rather
than eyeballing** — read back geometry, computed styles and contrast with
`javascript_tool`, check both mobile (375) and desktop, and check the breakpoint
edge when a change is breakpoint-scoped.

Note `overflow-hidden` on the hero photo section is load-bearing: it clips
`HeroSlider`'s `1.04 → 1` zoom. Anything that must straddle the section's bottom
edge has to live outside it as a sibling with a negative top margin.

## Conventions

- Comments explain **why**, not what.
- Match the surrounding file's density and idiom.
