-- =============================================================================
-- Aid For Men Foundation — chatbot settings
-- =============================================================================
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run.
--
-- A singleton row holding everything the assistant needs: whether it is on, how
-- it introduces itself, and the brief that grounds every answer.
--
-- NOTE ON THE BRIEF: this row is publicly readable. Only the anon key exists in
-- this project, so the API route reads it with the same privileges any visitor
-- has — there is no way to hide a column from the browser but not from the
-- server. That is acceptable here because the brief is the material the bot
-- repeats to visitors anyway. Do not put anything private in it. If a
-- service-role key is added later, the brief can be locked down properly.
-- =============================================================================

begin;

create table if not exists public.chatbot_settings (
  id             boolean primary key default true,
  is_enabled     boolean not null default false,

  bot_name       text not null default 'সহায়ক',
  bot_name_en    text,
  greeting       text not null default 'আসসালামু আলাইকুম। এইড ফর মেন ফাউন্ডেশন সম্পর্কে আপনার কী জানার আছে?',
  greeting_en    text,

  -- The grounding material. Everything the assistant is allowed to rely on.
  brief          text,
  brief_en       text,

  -- Shown under the composer, and repeated to the model as a hard rule.
  disclaimer     text not null default 'আমরা আইনজীবী নই। এখানকার তথ্য সাধারণ দিকনির্দেশনা, আইনি পরামর্শ নয়।',
  disclaimer_en  text,

  -- Editable so the model can be changed without a deploy.
  model          text not null default 'gpt-4o-mini',
  -- Soft cap per conversation, to bound spend if the widget is abused.
  max_turns      integer not null default 12,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint chatbot_settings_singleton check (id),
  constraint chatbot_settings_max_turns_sane check (max_turns between 1 and 50)
);

drop trigger if exists chatbot_settings_set_updated_at on public.chatbot_settings;
create trigger chatbot_settings_set_updated_at
  before update on public.chatbot_settings
  for each row execute function public.set_updated_at();

insert into public.chatbot_settings (id) values (true)
on conflict (id) do nothing;

alter table public.chatbot_settings enable row level security;

drop policy if exists chatbot_settings_public_read on public.chatbot_settings;
create policy chatbot_settings_public_read on public.chatbot_settings
  for select using (true);

drop policy if exists chatbot_settings_admin_write on public.chatbot_settings;
create policy chatbot_settings_admin_write on public.chatbot_settings
  for all using (public.is_admin()) with check (public.is_admin());

commit;

-- =============================================================================
-- Verify (optional):
--   select is_enabled, model, max_turns, length(coalesce(brief,'')) as brief_len
--   from public.chatbot_settings;
-- =============================================================================
