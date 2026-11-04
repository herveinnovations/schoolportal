/* ============================================================
   Staff ID: lecturers and staff must enter a school-issued Staff ID
   (as well as email and password) before any staff powers work.
   The check is enforced here in the database, per sign-in session.
   ============================================================ */

-- A random, hard-to-guess ID such as ATC-7K4P-92QX (no 0/O/1/I to avoid mix-ups)
create or replace function public.new_staff_code() returns text
language plpgsql volatile set search_path = public, extensions as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  b bytea := extensions.gen_random_bytes(8);
  out text := 'ATC-';
begin
  for i in 0..7 loop
    if i = 4 then out := out || '-'; end if;
    out := out || substr(alphabet, (get_byte(b, i) % 32) + 1, 1);
  end loop;
  return out;
end $$;

create table public.staff_codes (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);
alter table public.staff_codes enable row level security;

-- Invitations carry the ID, so the admin can hand it over before the person accepts
alter table public.staff_invites add column if not exists staff_code text unique default public.new_staff_code();
update public.staff_invites set staff_code = public.new_staff_code() where staff_code is null;

-- Which sign-in sessions have entered the correct Staff ID
create table public.staff_sessions (
  session_id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  verified_at timestamptz not null default now()
);
alter table public.staff_sessions enable row level security;

create table public.staff_code_attempts (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  ok boolean not null,
  at timestamptz not null default now()
);
create index on public.staff_code_attempts (user_id, at desc);
alter table public.staff_code_attempts enable row level security;

/* ---------- Is this sign-in allowed to act as staff? ---------- */

create or replace function public.staff_session_ok() returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when not exists (select 1 from public.profiles where id = auth.uid() and role in ('staff', 'lecturer')) then true
    else exists (
      select 1 from public.staff_sessions
      where user_id = auth.uid() and session_id::text = coalesce(auth.jwt() ->> 'session_id', '')
    )
  end
$$;

-- Staff and lecturers who haven't entered their Staff ID in this session have no role at all
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select case when role in ('staff', 'lecturer') and not public.staff_session_ok() then null else role end
  from public.profiles where id = auth.uid() and active
$$;

create or replace function public.my_staff_role() returns text
language sql stable security definer set search_path = public as $$
  select staff_role from public.profiles
  where id = auth.uid() and role = 'staff' and active and public.staff_session_ok()
$$;

create or replace function public.is_staff(roles text[] default null) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'staff' and active
      and (roles is null or staff_role = 'admin' or staff_role = any (roles))
  ) and public.staff_session_ok()
$$;

create or replace function public.teaches_course(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.courses where id = c and lecturer_id = auth.uid()) and public.staff_session_ok()
$$;

create or replace function public.teaches_student(s uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.enrollments e join public.courses c on c.id = e.course_id
    where e.student_id = s and c.lecturer_id = auth.uid()
  ) and public.staff_session_ok()
$$;

create or replace function public.can_see_document(aud text, course uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when aud = 'public' then true
    when auth.uid() is null then false
    when not public.staff_session_ok() then false
    when public.is_staff() then true
    when aud = 'all' then true
    when aud = 'students' then public.my_role() = 'student'
    when aud = 'lecturers' then public.my_role() = 'lecturer'
    when aud = 'course' then public.is_enrolled(course) or public.teaches_course(course)
    else false
  end
$$;

/* ---------- Enter the Staff ID (5 wrong tries locks it for 15 minutes) ---------- */

create or replace function public.verify_staff_code(code text) returns text
language plpgsql volatile security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  sid text := auth.jwt() ->> 'session_id';
  fails int;
begin
  if uid is null or sid is null then return 'not_signed_in'; end if;
  if not exists (select 1 from public.profiles where id = uid and role in ('staff', 'lecturer') and active) then
    return 'not_staff';
  end if;
  select count(*) into fails from public.staff_code_attempts
  where user_id = uid and not ok and at > now() - interval '15 minutes';
  if fails >= 5 then return 'locked'; end if;

  if exists (select 1 from public.staff_codes s where s.user_id = uid
             and s.code = upper(regexp_replace(coalesce(verify_staff_code.code, ''), '\s', '', 'g'))) then
    insert into public.staff_code_attempts (user_id, ok) values (uid, true);
    insert into public.staff_sessions (session_id, user_id) values (sid::uuid, uid) on conflict (session_id) do nothing;
    delete from public.staff_sessions where user_id = uid and verified_at < now() - interval '60 days';
    return 'ok';
  end if;
  insert into public.staff_code_attempts (user_id, ok) values (uid, false);
  return case when fails + 1 >= 5 then 'locked' else 'wrong' end;
end $$;

/* ---------- Every lecturer and staff account gets an ID ---------- */

create or replace function public.ensure_staff_code() returns trigger
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if new.role in ('staff', 'lecturer') then
    select staff_code into c from public.staff_invites where lower(email) = lower(new.email);
    insert into public.staff_codes (user_id, code) values (new.id, coalesce(c, public.new_staff_code()))
    on conflict (user_id) do nothing;
  end if;
  return new;
end $$;
create trigger ensure_staff_code after insert or update of role on public.profiles
  for each row execute function public.ensure_staff_code();

insert into public.staff_codes (user_id, code)
select p.id, coalesce(i.staff_code, public.new_staff_code())
from public.profiles p left join public.staff_invites i on lower(i.email) = lower(p.email)
where p.role in ('staff', 'lecturer')
on conflict (user_id) do nothing;

-- Admin gives someone a new ID (e.g. if it leaked). Their current sign-ins must re-enter it.
create or replace function public.reset_staff_code(target uuid) returns text
language plpgsql volatile security definer set search_path = public as $$
declare c text := public.new_staff_code();
begin
  if not public.is_staff(array['admin']) or public.my_staff_role() <> 'admin' then
    raise exception 'Only an administrator can do this';
  end if;
  update public.staff_codes set code = c, created_at = now() where user_id = target;
  if not found then raise exception 'That account has no Staff ID'; end if;
  delete from public.staff_sessions where user_id = target and session_id::text <> coalesce(auth.jwt() ->> 'session_id', '');
  return c;
end $$;

create policy "admin sees staff ids" on public.staff_codes for select to authenticated
  using (public.my_staff_role() = 'admin');

/* ---------- Keep staff details private ---------- */

-- Before: every signed-in person could read every lecturer and staff profile.
-- Now: staff see everyone (existing policy), lecturers see colleagues, students only see their own lecturers.
drop policy if exists "everyone sees lecturers and staff" on public.profiles;
create policy "lecturers see colleagues" on public.profiles for select to authenticated
  using (role in ('lecturer', 'staff') and public.my_role() = 'lecturer');
create or replace function public.is_my_lecturer(l uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.enrollments e join public.courses c on c.id = e.course_id
                 where e.student_id = auth.uid() and c.lecturer_id = l)
$$;
create policy "students see their lecturers" on public.profiles for select to authenticated
  using (role = 'lecturer' and public.is_my_lecturer(id));

revoke execute on function public.ensure_staff_code() from public, anon, authenticated;
revoke execute on function public.is_my_lecturer(uuid) from public, anon;
grant execute on function public.is_my_lecturer(uuid) to authenticated;
revoke execute on function public.staff_session_ok(), public.verify_staff_code(text), public.reset_staff_code(uuid) from public, anon;
grant execute on function public.staff_session_ok(), public.verify_staff_code(text), public.reset_staff_code(uuid) to authenticated;
