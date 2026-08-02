@AGENTS.md

# Aid For Men Foundation — website

Bilingual (Bengali / English) site for a Bangladeshi non-profit: public pages, a
members' forum, an admin CMS, and a grounded chatbot. Bengali is the source
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
  (admin)/admin/…       CMS, no locale prefix, admin-only
  api/chat/route.ts     chatbot endpoint (streams text/plain)
  globals.css           the entire design system
  fonts.ts              next/font — Inter (Latin) + Kalpurush/Noto Serif Bengali
components/
  ui/                   shared primitives — Button, Container, Card, Badge, Field…
  admin/  forum/  chat/ feature components
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
  `site_settings`, `team_members`, `activities`, `videos`,
  `newsletter_subscribers`, `forum_posts` / `_comments` / `_reactions` /
  `_post_media`, `profiles`, `chatbot_settings`. Public read, admin write;
  forum writes require an approved member.
- **Schema changes ship as a new numbered `.sql` file** in
  `supabase/migrations/` for the user to paste into the SQL editor. Only the
  anon key exists locally, so DDL cannot run from code. Migrations 0001–0007 are
  applied; write them to be safe to re-run.

## Server actions

Every mutation lives in `lib/actions/`, is gated, and returns one shape:

```ts
type ActionResult<T> = { ok: true; data?: T } | { ok: false; error: string }
```

- Gate with `requireAdmin()` or `requireApprovedMember()` from
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
