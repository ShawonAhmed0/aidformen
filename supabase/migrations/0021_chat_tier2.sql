-- =============================================================================
-- Aid For Men Foundation — chat Tier 2: keep history, shared rate limit,
-- case documents, cached AI summaries
-- =============================================================================
-- 1. Conversations are kept indefinitely: history_retention_days may now be
--    null ("never delete"), and the foundation chose that. A number still
--    works for anyone who later wants automatic deletion back.
-- 2. chat_rate_allow(): a per-key counter shared by every Vercel instance, so
--    the chat's rate limit holds across servers, not just within one.
-- 3. Case documents: visitors attach photos (sent as one PDF) or PDFs to their
--    chat. They go to the private `case-documents` bucket; only admins read.
-- 4. chat_range_summaries: Claude's summary of any date range (a day, week,
--    month, year or custom range), generated from the admin panel and cached.
--
-- Safe to re-run.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Keep conversations
-- ---------------------------------------------------------------------------

alter table public.chatbot_settings
  alter column history_retention_days drop not null,
  alter column history_retention_days set default null;

alter table public.chatbot_settings
  drop constraint if exists chatbot_settings_history_retention_sane;

alter table public.chatbot_settings
  add constraint chatbot_settings_history_retention_sane
  check (history_retention_days is null or history_retention_days between 7 and 3650);

update public.chatbot_settings set history_retention_days = null where id = true;

-- As in 0013, except that a null retention deletes nothing.
create or replace function public.start_chat_conversation(
  p_visitor_name text,
  p_phone text,
  p_locale text default 'bn'
)
returns table (conversation_id uuid, conversation_token uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := regexp_replace(btrim(coalesce(p_visitor_name, '')), '[[:space:]]+', ' ', 'g');
  v_phone text := regexp_replace(
    translate(coalesce(p_phone, ''), '০১২৩৪৫৬৭৮৯', '0123456789'),
    '[[:space:]()-]',
    '',
    'g'
  );
  v_locale text := case when p_locale = 'en' then 'en' else 'bn' end;
  v_id uuid;
  v_token uuid;
  v_retention integer;
begin
  if char_length(v_name) < 2 or char_length(v_name) > 100 then
    raise exception 'Name must be between 2 and 100 characters';
  end if;

  if v_phone !~ '^01[3-9][0-9]{8}$' then
    raise exception 'A valid 11-digit Bangladesh mobile number is required';
  end if;

  if (
    select count(*)
    from public.chat_conversations
    where phone = v_phone and created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'Too many chat sessions. Please try again later';
  end if;

  select history_retention_days
  into v_retention
  from public.chatbot_settings
  where id = true;

  if v_retention is not null then
    delete from public.chat_conversations
    where updated_at < now() - make_interval(days => v_retention);
  end if;

  insert into public.chat_conversations (visitor_name, phone, locale)
  values (v_name, v_phone, v_locale)
  returning id, access_token into v_id, v_token;

  return query select v_id, v_token;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Shared rate limit
-- ---------------------------------------------------------------------------

create table if not exists public.chat_rate_hits (
  key           text not null,
  window_start  timestamptz not null,
  hits          integer not null default 0,
  primary key (key, window_start)
);

alter table public.chat_rate_hits enable row level security;
revoke all on table public.chat_rate_hits from anon, authenticated;

-- Counts one request for `p_key` in the current fixed window and says whether
-- it is within `p_limit`. The key is a hash the server builds from the
-- visitor's IP, so no address is stored.
create or replace function public.chat_rate_allow(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz;
  v_hits integer;
begin
  if p_key is null or char_length(p_key) not between 8 and 128
     or p_limit not between 1 and 1000
     or p_window_seconds not between 1 and 86400 then
    return false;
  end if;

  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.chat_rate_hits as h (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = h.hits + 1
  returning h.hits into v_hits;

  -- Old windows are dead weight; sweep them on roughly one call in a hundred.
  if random() < 0.01 then
    delete from public.chat_rate_hits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.chat_rate_allow(text, integer, integer) from public;
grant execute on function public.chat_rate_allow(text, integer, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Case documents
-- ---------------------------------------------------------------------------

-- Private, PDF only, 15 MB a file. Photos are turned into one PDF in the
-- browser before upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('case-documents', 'case-documents', false, 15728640, array['application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.chat_documents (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.chat_conversations (id) on delete cascade,
  path             text not null unique,
  file_name        text,
  pages            integer check (pages is null or pages between 1 and 500),
  bytes            integer check (bytes is null or bytes between 1 and 15728640),
  created_at       timestamptz not null default now()
);

create index if not exists chat_documents_conversation_idx
  on public.chat_documents (conversation_id, created_at);

alter table public.chat_documents enable row level security;
revoke all on table public.chat_documents from anon, authenticated;
grant select, delete on table public.chat_documents to authenticated;

drop policy if exists chat_documents_admin_read on public.chat_documents;
create policy chat_documents_admin_read on public.chat_documents
  for select using (public.is_admin());

drop policy if exists chat_documents_admin_delete on public.chat_documents;
create policy chat_documents_admin_delete on public.chat_documents
  for delete using (public.is_admin());

-- A visitor may upload only into their own chat's folder:
--   <conversation id>/<conversation token>/<random uuid>.pdf
-- The token in the path is the same secret the chat API already requires;
-- the bucket is private, so only admins ever see it. Ten files a chat.
create or replace function public.chat_document_path_ok(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_parts text[] := string_to_array(coalesce(p_name, ''), '/');
  v_uuid constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if array_length(v_parts, 1) <> 3
     or v_parts[1] !~ v_uuid
     or v_parts[2] !~ v_uuid
     or v_parts[3] !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$' then
    return false;
  end if;

  return exists (
    select 1 from public.chat_conversations
    where id = v_parts[1]::uuid and access_token = v_parts[2]::uuid
  ) and (
    select count(*) from storage.objects
    where bucket_id = 'case-documents' and name like v_parts[1] || '/%'
  ) < 10;
end;
$$;

revoke all on function public.chat_document_path_ok(text) from public;
grant execute on function public.chat_document_path_ok(text) to anon, authenticated;

drop policy if exists case_documents_visitor_insert on storage.objects;
create policy case_documents_visitor_insert on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'case-documents' and public.chat_document_path_ok(name));

drop policy if exists case_documents_admin_read on storage.objects;
create policy case_documents_admin_read on storage.objects
  for select to authenticated
  using (bucket_id = 'case-documents' and public.is_admin());

drop policy if exists case_documents_admin_delete on storage.objects;
create policy case_documents_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'case-documents' and public.is_admin());

-- Records an uploaded file against its chat. Called by /api/chat/document,
-- which sits behind BotID and the rate limit. The file must already exist.
create or replace function public.add_chat_document(
  p_conversation_id uuid,
  p_conversation_token uuid,
  p_path text,
  p_file_name text,
  p_pages integer,
  p_bytes integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not exists (
    select 1 from public.chat_conversations
    where id = p_conversation_id and access_token = p_conversation_token
  ) then
    return null;
  end if;

  if p_path is null
     or p_path not like p_conversation_id::text || '/' || p_conversation_token::text || '/%'
     or not exists (
       select 1 from storage.objects
       where bucket_id = 'case-documents' and name = p_path
     ) then
    return null;
  end if;

  insert into public.chat_documents (conversation_id, path, file_name, pages, bytes)
  values (
    p_conversation_id,
    p_path,
    nullif(left(btrim(coalesce(p_file_name, '')), 160), ''),
    case when p_pages between 1 and 500 then p_pages end,
    case when p_bytes between 1 and 15728640 then p_bytes end
  )
  on conflict (path) do nothing
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.add_chat_document(uuid, uuid, text, text, integer, integer) from public;
grant execute on function public.add_chat_document(uuid, uuid, text, text, integer, integer)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Cached AI summaries of a date range
-- ---------------------------------------------------------------------------
-- Keyed by the range itself (Dhaka dates, inclusive), so a day, a week, a
-- month, a year or any custom range on the Problem feed all share one cache.

create table if not exists public.chat_range_summaries (
  range_from    date not null,
  range_to      date not null,
  summary_bn    text not null,
  summary_en    text not null,
  -- How many counted chats the summary was written from; a different count
  -- now means it is out of date and gets rewritten.
  chat_count    integer not null check (chat_count >= 0),
  generated_at  timestamptz not null default now(),
  primary key (range_from, range_to),
  check (range_to >= range_from)
);

alter table public.chat_range_summaries enable row level security;
revoke all on table public.chat_range_summaries from anon, authenticated;
grant select, insert, update, delete on table public.chat_range_summaries to authenticated;

drop policy if exists chat_range_summaries_admin_all on public.chat_range_summaries;
create policy chat_range_summaries_admin_all on public.chat_range_summaries
  for all using (public.is_admin()) with check (public.is_admin());

commit;

notify pgrst, 'reload schema';
