-- =============================================================================
-- Aid For Men Foundation — switch the chatbot to Claude
-- =============================================================================
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run.
--
-- 0005 seeded the chatbot with an OpenAI model id. The assistant now runs on
-- Anthropic's Messages API, so the stored id has to move with it — an OpenAI
-- id sent to Anthropic is a 404, and the model is admin-editable precisely so
-- it can be changed without a deploy.
-- =============================================================================

begin;

alter table public.chatbot_settings
  alter column model set default 'claude-opus-5';

-- Only rewrite rows still carrying the old default. A deliberate choice made
-- in the admin panel is left alone.
update public.chatbot_settings
set model = 'claude-opus-5'
where model like 'gpt-%';

commit;

-- =============================================================================
-- Verify (optional):
--   select is_enabled, model, max_turns from public.chatbot_settings;
-- =============================================================================
