-- =============================================================================
-- Aid For Men Foundation — cheapest suitable chatbot model
-- =============================================================================
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run.
--
-- The assistant only ever answers from the admin-written brief, so it does no
-- reasoning worth paying Opus rates for. Haiku 4.5 is a fifth of the cost per
-- token and ample for the job.
--
-- You can change this at any time from the dropdown in /admin/chatbot — this
-- migration only moves the stored value and the default for a fresh install.
-- =============================================================================

begin;

alter table public.chatbot_settings
  alter column model set default 'claude-haiku-4-5';

-- Only rewrite rows still carrying a previous default. A model deliberately
-- chosen in the admin panel is left alone.
update public.chatbot_settings
set model = 'claude-haiku-4-5'
where model in ('claude-opus-5', 'gpt-4o-mini');

commit;

-- =============================================================================
-- Verify (optional):
--   select is_enabled, model, max_turns from public.chatbot_settings;
-- =============================================================================
