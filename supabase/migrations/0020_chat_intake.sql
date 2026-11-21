-- =============================================================================
-- Aid For Men Foundation — chat intake: AI tags on each conversation
-- =============================================================================
-- After every exchange the server has Claude read the conversation and record
-- the problem category, age, occupation, a short summary and whether the
-- session looks fake. Visitors are never asked to categorise themselves. The
-- admin Problem feed (/admin/cases) is built on these columns.
--
-- The tags live on chat_conversations, so they expire with the transcript
-- after history_retention_days — the period visitors are told about. Reports
-- that must outlive that window need a table of their own.
--
-- Safe to re-run.
-- =============================================================================

begin;

-- One list each, used by the constraints and the functions below. The ids
-- must match chatCategories / occupationGroups in lib/types/chatbot.ts.
create or replace function public.chat_category_ids()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array[
    'dowry_case',
    'women_repression_case',
    'domestic_violence',
    'marriage_promise_case',
    'false_case',
    'family_dispute',
    'other_issue',
    'general_info'
  ]::text[];
$$;

create or replace function public.chat_occupation_group_ids()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array[
    'student',
    'private_job',
    'government_job',
    'business',
    'farmer',
    'worker',
    'expatriate',
    'unemployed',
    'other',
    'unknown'
  ]::text[];
$$;

alter table public.chat_conversations
  add column if not exists category            text,
  add column if not exists age                 smallint,
  add column if not exists occupation          text,
  add column if not exists occupation_group    text,
  add column if not exists ai_summary          text,
  add column if not exists ai_summary_en       text,
  add column if not exists is_suspicious       boolean not null default false,
  add column if not exists suspicious_reason   text,
  -- An admin's verdict. Null defers to the AI flag; set, it wins, and later
  -- tagging never overwrites it.
  add column if not exists suspicious_override boolean,
  add column if not exists tagged_at           timestamptz;

alter table public.chat_conversations
  drop constraint if exists chat_conversations_category_known,
  drop constraint if exists chat_conversations_occupation_group_known,
  drop constraint if exists chat_conversations_age_sane;

alter table public.chat_conversations
  add constraint chat_conversations_category_known
    check (category is null or category = any (public.chat_category_ids())),
  add constraint chat_conversations_occupation_group_known
    check (occupation_group is null or occupation_group = any (public.chat_occupation_group_ids())),
  add constraint chat_conversations_age_sane
    check (age is null or age between 10 and 100);

-- The feed filters by the day a conversation started.
create index if not exists chat_conversations_created_idx
  on public.chat_conversations (created_at desc);

-- Only a new exchange is activity. Tagging and an admin's review must not
-- move updated_at: it orders the history list and drives retention.
drop trigger if exists chat_conversations_set_updated_at on public.chat_conversations;
create trigger chat_conversations_set_updated_at
  before update of summary, message_count on public.chat_conversations
  for each row execute function public.set_updated_at();

-- Admins may record a verdict on a flagged session — that column only.
grant update (suspicious_override) on table public.chat_conversations to authenticated;

drop policy if exists chat_conversations_admin_review on public.chat_conversations;
create policy chat_conversations_admin_review on public.chat_conversations
  for update using (public.is_admin()) with check (public.is_admin());

-- Called by /api/chat after each exchange with Claude's reading of the
-- conversation. Like append_chat_exchange it needs the session's token, so
-- only the visitor's own session can be tagged — and a visitor who called it
-- directly could only mislabel their own chat, which typing could do anyway.
create or replace function public.tag_chat_conversation(
  p_conversation_id uuid,
  p_conversation_token uuid,
  p_age integer,
  p_occupation text,
  p_occupation_group text,
  p_category text,
  p_summary text,
  p_summary_en text,
  p_is_suspicious boolean,
  p_suspicious_reason text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_suspicious boolean := coalesce(p_is_suspicious, false);
begin
  -- Age and occupation are sticky: once stated they stay, and a later pass
  -- that doesn't see them (a long chat, an off-topic turn) cannot blank them.
  update public.chat_conversations
  set
    age = coalesce(case when p_age between 10 and 100 then p_age end, age),
    occupation = coalesce(nullif(left(btrim(coalesce(p_occupation, '')), 120), ''), occupation),
    occupation_group = case
      when p_occupation_group <> 'unknown'
        and p_occupation_group = any (public.chat_occupation_group_ids()) then p_occupation_group
      else coalesce(occupation_group, 'unknown')
    end,
    -- The latest reading wins, since later messages say more — but "unclear"
    -- (stored as null) never wipes a category already found.
    category = coalesce(
      case when p_category = any (public.chat_category_ids()) then p_category end,
      category
    ),
    ai_summary = nullif(left(btrim(coalesce(p_summary, '')), 600), ''),
    ai_summary_en = nullif(left(btrim(coalesce(p_summary_en, '')), 600), ''),
    is_suspicious = v_suspicious,
    suspicious_reason = case
      when v_suspicious then nullif(left(btrim(coalesce(p_suspicious_reason, '')), 300), '')
      else null
    end,
    tagged_at = now()
  where id = p_conversation_id and access_token = p_conversation_token;

  return found;
end;
$$;

revoke all on function public.tag_chat_conversation(
  uuid, uuid, integer, text, text, text, text, text, boolean, text
) from public;

grant execute on function public.tag_chat_conversation(
  uuid, uuid, integer, text, text, text, text, text, boolean, text
) to anon, authenticated;

commit;

-- PostgREST caches the schema; the new function and columns must be re-read.
notify pgrst, 'reload schema';

-- =============================================================================
-- Verify as an administrator:
--   select created_at, visitor_name, category, age, occupation,
--          ai_summary, is_suspicious, suspicious_override
--   from public.chat_conversations order by created_at desc limit 20;
-- =============================================================================
