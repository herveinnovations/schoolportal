-- Website content that staff can edit, plus uploaded documents and file storage.

/* ---------- Editable website content (photos and text) ---------- */
create table public.site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);
alter table public.site_content enable row level security;
create policy "anyone reads site content" on public.site_content for select to anon, authenticated using (true);
create policy "registrar edits site content" on public.site_content for all to authenticated
  using (public.is_staff(array['registrar'])) with check (public.is_staff(array['registrar']));
grant select on public.site_content to anon;
grant select, insert, update, delete on public.site_content to authenticated;

/* ---------- Documents (prospectus, forms, handouts...) ---------- */
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  file_path text not null unique,           -- path inside the "documents" storage bucket
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  audience text not null default 'students' check (audience in ('public', 'all', 'students', 'lecturers', 'course')),
  course_id uuid references public.courses (id) on delete cascade,
  uploaded_by uuid references public.profiles (id) on delete set null,
  uploaded_by_name text,
  created_at timestamptz not null default now()
);
create index on public.documents (created_at desc);

-- Who may see a document (used by the table and by file storage)
create or replace function public.can_see_document(aud text, course uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when aud = 'public' then true
    when auth.uid() is null then false
    when public.is_staff() then true
    when aud = 'all' then true
    when aud = 'students' then public.my_role() = 'student'
    when aud = 'lecturers' then public.my_role() = 'lecturer'
    when aud = 'course' then public.is_enrolled(course) or public.teaches_course(course)
    else false
  end
$$;
grant execute on function public.can_see_document(text, uuid) to anon, authenticated;

alter table public.documents enable row level security;
create policy "see allowed documents" on public.documents for select to anon, authenticated
  using (public.can_see_document(audience, course_id));
create policy "registrar manages documents" on public.documents for all to authenticated
  using (public.is_staff(array['registrar'])) with check (public.is_staff(array['registrar']));
grant select on public.documents to anon;
grant select, insert, update, delete on public.documents to authenticated;

/* ---------- File storage ---------- */
-- site-media: website photos and course pictures (public, so the website can show them)
-- documents:  private; downloads use short-lived links and respect the audience above
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('site-media', 'site-media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('documents', 'documents', false, 26214400, null)
on conflict (id) do nothing;

create policy "site media is public" on storage.objects for select to anon, authenticated
  using (bucket_id = 'site-media');
create policy "registrar uploads site media" on storage.objects for insert to authenticated
  with check (bucket_id = 'site-media' and public.is_staff(array['registrar']));
create policy "registrar replaces site media" on storage.objects for update to authenticated
  using (bucket_id = 'site-media' and public.is_staff(array['registrar']));
create policy "registrar removes site media" on storage.objects for delete to authenticated
  using (bucket_id = 'site-media' and public.is_staff(array['registrar']));

create policy "download allowed documents" on storage.objects for select to anon, authenticated
  using (bucket_id = 'documents' and exists (
    select 1 from public.documents d where d.file_path = storage.objects.name and public.can_see_document(d.audience, d.course_id)));
create policy "registrar uploads documents" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and public.is_staff(array['registrar']));
create policy "registrar removes documents" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and public.is_staff(array['registrar']));

-- Live updates for the website content and documents
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.site_content, public.documents;
  end if;
end $$;
