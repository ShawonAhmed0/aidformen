# Handoff — design overhaul + admin CMS + i18n

The work described by the previous version of this file is **done**. One user
action is still outstanding (see below). Delete this file once that is applied.

---

## OUTSTANDING — one action for you

`supabase/migrations/0002_newsletter.sql` has **not been run yet**. Until it is,
the homepage newsletter form errors, because `lib/actions/newsletter.ts` inserts
into a `newsletter_subscribers` table that does not exist.

Supabase dashboard → SQL Editor → New query → paste the file → Run. It is
guarded throughout, so re-running it is a no-op.

`0001_admin_cms.sql` was already applied in the previous session.

---

## What was completed in this session

| Item | Notes |
|---|---|
| Build | `npm run build` passes. Was failing on `lib/i18n/dictionary.ts` |
| Lint | `npx eslint .` clean |
| Newsletter migration | `0002_newsletter.sql` written (needs running) |
| Site settings admin | `/admin/settings` |
| Activities admin | `/admin/activities` |
| Videos admin | `/admin/videos` |
| `app/code.html` | Deleted — stray 37 KB design mockup, nothing referenced it |

The build failure was `dictionary.ts` declaring the Bengali strings `as const`.
That made every value a *literal* type, so `en satisfies typeof bn` demanded the
English strings be character-for-character identical to the Bengali ones.
Dropping `as const` widens them to `string`; the shape check still holds.

New files: `lib/actions/settings.ts`, `lib/actions/activities.ts`,
`lib/actions/videos.ts`, `components/admin/SettingsEditor.tsx`,
`components/admin/ActivitiesManager.tsx`, `components/admin/VideosManager.tsx`,
plus a page under `app/(admin)/admin/` for each. `urlField()` was added to
`lib/actions/shared.ts` — unlike `hrefField()` it rejects internal paths, since a
social profile URL is never a path on this site.

Every sidebar link now resolves; nothing 404s.

---

## Verification actually performed

Locale redirect matrix, measured against the running proxy:

| Cookie | `Accept-Language` | Redirect |
|---|---|---|
| — | `bn` | `/bn` |
| — | `en` | `/en` |
| — | `fr` (unsupported) | `/bn` (default) |
| `bn` | `en` | `/bn` — cookie wins |
| `en` | `bn` | `/en` — cookie wins |

Also confirmed: the switcher is a real link, writes `NEXT_LOCALE` and navigates;
`<html lang>` tracks the locale; dictionary chrome swaps language; all six
`/admin/*` routes 307 to login rather than 404; no console or server errors.

**Not exercised with live data:** that a DB `_en` value *overrides* the Bengali
one. No `_en` column is populated in the database, and only the anon key is
available locally, so no row could be written to test it. The *fallback*
direction is confirmed at runtime (English page, Bengali content). All 24 `_en`
columns are referenced in the app, and every public rendering surface goes
through `pick()`. Worth a spot-check the first time you translate a real field.

---

## Known, pre-existing, not changed

`proxy.ts` sends unauthenticated visitors to `/bn/login` regardless of their
locale, so an English visitor lands on the Bengali login page. One line to fix if
you want it, but it predates this work and was left alone.

---

## Conventions to follow

- Colours only via tokens: `brand-*`, `ochre-*`, `ink-*`, `danger|success|warning`.
  No raw hex in components.
- Focus is styled once globally in `globals.css` — do not add per-component focus rings.
- Touch targets ≥44px (`size="md"` on Button is `h-11`).
- Transitions 150–250ms via the `transition-ui` utility.
- Bilingual fields use `<BilingualField>`; render with `pick(locale, bn, en)`.
- Server actions return `{ ok: true } | { ok: false, error }` and go through
  `requireAdmin()` + `guarded()`.
- Schema changes must be a new `.sql` file — there is no service-role key, so
  DDL cannot be run from code.
- Comments explain *why*, not *what*.
