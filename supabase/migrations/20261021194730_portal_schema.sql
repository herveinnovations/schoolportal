-- Alphatech Computer Institute portal: tables, security rules and server-side functions.
-- Safe to run once on a fresh Supabase project (SQL editor, or `supabase db push`).

create extension if not exists pgcrypto;

/* ============================================================
   Settings and people
   ============================================================ */

-- Who becomes the first administrator. Change the email before running if needed.
create table public.app_settings (
  key text primary key,
  value text not null
);
insert into public.app_settings (key, value) values ('owner_email', 'dafredmukunah@gmail.com');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null,
  role text not null default 'student' check (role in ('student', 'lecturer', 'staff')),
  staff_role text check (staff_role in ('admin', 'finance', 'registrar')),
  bio text,
  profile_picture text,
  has_completed_payment boolean not null default false,
  student_number text unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Private student details (NRC, phone, guardian...). Only the student and staff can see them.
create table public.student_details (
  id uuid primary key references public.profiles (id) on delete cascade,
  personal_details jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Lecturer and staff accounts are created by invitation only.
create table public.staff_invites (
  email text primary key,
  name text not null,
  role text not null check (role in ('lecturer', 'staff')),
  staff_role text check (staff_role in ('admin', 'finance', 'registrar')),
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

/* ---------- Helper functions (run with owner rights so policies don't loop) ---------- */

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.my_staff_role() returns text
language sql stable security definer set search_path = public as $$
  select staff_role from public.profiles where id = auth.uid() and role = 'staff' and active
$$;

create or replace function public.is_staff(roles text[] default null) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'staff' and active
      and (roles is null or staff_role = 'admin' or staff_role = any (roles))
  )
$$;

/* ============================================================
   Courses and enrolment
   ============================================================ */

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  lecturer_id uuid references public.profiles (id) on delete set null,
  lecturer_name text not null default 'To be assigned',
  credits integer not null default 0,
  price numeric(12, 2) not null default 0 check (price >= 0),
  currency text not null default 'ZMW',
  syllabus text,
  level text check (level in ('beginner', 'advanced', 'teveta_level_3')),
  image_url text,
  created_at timestamptz not null default now()
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  type text not null default 'full-time' check (type in ('full-time', 'part-time')),
  payment_plan text not null default 'full' check (payment_plan in ('full', 'installments-3', 'installments-6')),
  total_amount numeric(12, 2) not null default 0,
  amount_paid numeric(12, 2) not null default 0,
  enrolled_at timestamptz not null default now(),
  unique (student_id, course_id)
);

create or replace function public.teaches_course(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.courses where id = c and lecturer_id = auth.uid())
$$;

create or replace function public.is_enrolled(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.enrollments where course_id = c and student_id = auth.uid())
$$;

create or replace function public.teaches_student(s uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.enrollments e join public.courses c on c.id = e.course_id
    where e.student_id = s and c.lecturer_id = auth.uid()
  )
$$;

-- The fee is always the course price at the moment of enrolment, and nothing is paid yet.
create or replace function public.enrollment_defaults() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    select price into new.total_amount from public.courses where id = new.course_id;
    new.amount_paid := 0;
    new.enrolled_at := now();
  end if;
  return new;
end $$;
create trigger enrollment_defaults before insert on public.enrollments
  for each row execute function public.enrollment_defaults();

/* ============================================================
   Teaching: timetable, live classes, recordings, assignments
   ============================================================ */

create table public.timetable (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  course_name text not null,
  day text not null,
  time text not null,
  room text not null default '',
  lecturer_id uuid references public.profiles (id) on delete set null,
  lecturer_name text not null default ''
);

create table public.live_classes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  course_name text not null,
  scheduled_time timestamptz not null,
  lecturer_id uuid references public.profiles (id) on delete set null,
  lecturer_name text not null default '',
  is_live boolean not null default false,
  meeting_url text,
  stream_url text
);

create table public.recordings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  course_name text not null,
  lecturer_id uuid references public.profiles (id) on delete set null,
  lecturer_name text not null default '',
  title text not null,
  recording_date timestamptz not null default now(),
  duration text not null default '',
  recording_url text not null,
  description text
);

create table public.homeworks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  course_name text not null,
  lecturer_id uuid references public.profiles (id) on delete set null,
  title text not null,
  description text not null default '',
  attachment text,
  assigned_date timestamptz not null default now(),
  due_date timestamptz not null
);

create table public.homework_submissions (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homeworks (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  student_name text not null,
  content text not null default '',
  submitted_at timestamptz not null default now(),
  grade numeric(5, 2) check (grade between 0 and 100),
  feedback text,
  graded_at timestamptz,
  unique (homework_id, student_id)
);

/* ============================================================
   Exams. Correct answers live in exam_keys, which students can't read.
   ============================================================ */

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  course_name text not null,
  lecturer_id uuid references public.profiles (id) on delete set null,
  lecturer_name text not null default '',
  title text not null,
  description text not null default '',
  attachment text,
  scheduled_date timestamptz not null,
  duration integer not null default 30,
  total_marks numeric(8, 2) not null default 0,
  questions jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.exam_keys (
  exam_id uuid primary key references public.exams (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb
);

create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  student_name text not null,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  answers jsonb not null default '{}'::jsonb,
  score numeric(8, 2),
  auto_score numeric(8, 2),
  essay_marks jsonb,
  needs_marking boolean,
  feedback text,
  marked_at timestamptz,
  is_submitted boolean not null default false,
  is_auto_submitted boolean,
  unique (exam_id, student_id)
);

/* ============================================================
   Money: payment claims are checked by Finance before they count
   ============================================================ */

create table public.payment_claims (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  student_name text not null,
  purpose text not null check (purpose in ('registration', 'course_fee', 'certificate')),
  course_id uuid references public.courses (id) on delete set null,
  course_name text,
  amount numeric(12, 2) not null check (amount > 0),
  method text not null check (method in ('mtn', 'airtel', 'bank', 'cash')),
  reference text not null,
  payer_phone text,
  note text,
  submitted_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  rejection_reason text
);

create table public.transactions (
  id uuid primary key,
  student_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null,
  currency text not null default 'ZMW',
  date timestamptz not null default now(),
  description text not null,
  type text not null check (type in ('registration', 'course_fee')),
  status text not null default 'completed' check (status in ('completed', 'pending', 'failed'))
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  student_name text not null,
  course_id uuid references public.courses (id) on delete set null,
  course_name text,
  title text not null,
  issue_date timestamptz not null default now(),
  file_url text not null default '',
  issuer_id uuid references public.profiles (id) on delete set null,
  issuer_name text not null default ''
);

/* ============================================================
   Attendance, announcements, notifications, activity
   ============================================================ */

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  live_class_id uuid not null references public.live_classes (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  student_name text not null,
  joined_at timestamptz not null default now(),
  marked_by text not null default 'auto' check (marked_by in ('auto', 'lecturer')),
  unique (live_class_id, student_id)
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  type text not null default 'general' check (type in ('general', 'academic', 'urgent')),
  audience text not null default 'all' check (audience in ('all', 'students', 'lecturers', 'course')),
  course_id uuid references public.courses (id) on delete cascade,
  date timestamptz not null default now(),
  author_name text not null default 'Administration'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  message text not null,
  timestamp timestamptz not null default now(),
  action_url text,
  related_id text,
  course_id uuid references public.courses (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  recipient_role text check (recipient_role in ('student', 'lecturer', 'all'))
);

create table public.notification_reads (
  notification_id uuid references public.notifications (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  user_name text not null,
  user_role text not null,
  action text not null check (action in ('login', 'join_class', 'leave_class', 'taught_class')),
  timestamp timestamptz not null default now(),
  details text
);

create index on public.enrollments (course_id);
create index on public.homework_submissions (homework_id);
create index on public.exam_attempts (exam_id);
create index on public.payment_claims (status, submitted_at);
create index on public.attendance (course_id);
create index on public.notifications (user_id);
create index on public.notifications (course_id);
create index on public.activity_logs (timestamp desc);

/* ============================================================
   New accounts: students sign up themselves; lecturers and staff come from an invite
   ============================================================ */

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  inv public.staff_invites;
  owner text;
  r text := 'student';
  sr text := null;
  nm text := coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1));
begin
  select value into owner from public.app_settings where key = 'owner_email';
  select * into inv from public.staff_invites where lower(email) = lower(new.email);
  if lower(new.email) = lower(owner) then
    r := 'staff'; sr := 'admin';
  elsif inv.email is not null then
    r := inv.role; sr := inv.staff_role; nm := coalesce(nullif(inv.name, ''), nm);
    update public.staff_invites set accepted_at = now() where email = inv.email;
  end if;
  insert into public.profiles (id, name, email, role, staff_role, has_completed_payment)
  values (new.id, nm, new.email, r, case when r = 'staff' then coalesce(sr, 'registrar') end, r <> 'student');
  if r = 'lecturer' then
    update public.courses set lecturer_id = new.id
    where lecturer_id is null and lower(lecturer_name) = lower(nm);
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- People can't promote themselves or change their own student number.
create or replace function public.guard_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() is null for the service role; app.trusted is set only inside review_payment.
  if auth.uid() is null or public.is_staff(array['registrar']) or current_setting('app.trusted', true) = 'on' then
    return new;
  end if;
  if new.role is distinct from old.role or new.staff_role is distinct from old.staff_role
     or new.student_number is distinct from old.student_number or new.active is distinct from old.active
     or new.email is distinct from old.email then
    raise exception 'Not allowed to change these account fields';
  end if;
  return new;
end $$;
create trigger guard_profile before update on public.profiles
  for each row execute function public.guard_profile();

-- Students may only save answers on an exam that hasn't been submitted; marking fields are for lecturers.
create or replace function public.guard_attempt() returns trigger
language plpgsql security definer set search_path = public as $$
declare e public.exams;
begin
  if auth.uid() is null or current_setting('app.trusted', true) = 'on' then return new; end if;
  select * into e from public.exams where id = new.exam_id;
  if public.my_role() = 'student' then
    if tg_op = 'INSERT' then
      if new.student_id <> auth.uid() or not e.is_published or e.scheduled_date > now() + interval '5 minutes' then
        raise exception 'This exam is not open';
      end if;
      new.is_submitted := false; new.score := null; new.auto_score := null; new.essay_marks := null;
      new.needs_marking := null; new.feedback := null; new.marked_at := null; new.end_time := null;
      new.start_time := now();
    else
      if old.is_submitted then raise exception 'This exam has already been submitted'; end if;
      new.is_submitted := old.is_submitted; new.score := old.score; new.auto_score := old.auto_score;
      new.essay_marks := old.essay_marks; new.needs_marking := old.needs_marking; new.feedback := old.feedback;
      new.marked_at := old.marked_at; new.end_time := old.end_time; new.start_time := old.start_time;
      new.student_id := old.student_id; new.exam_id := old.exam_id;
    end if;
  end if;
  return new;
end $$;
create trigger guard_attempt before insert or update on public.exam_attempts
  for each row execute function public.guard_attempt();

-- Students can't mark their own homework.
create or replace function public.guard_submission() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and public.my_role() = 'student' then
    new.grade := null; new.feedback := null; new.graded_at := null; new.submitted_at := now();
  end if;
  return new;
end $$;
create trigger guard_submission before insert or update on public.homework_submissions
  for each row execute function public.guard_submission();

-- New payment claims always start as pending.
create or replace function public.guard_claim() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.status := 'pending'; new.reviewed_by := null; new.reviewed_at := null; new.rejection_reason := null;
  new.submitted_at := now();
  return new;
end $$;
create trigger guard_claim before insert on public.payment_claims
  for each row execute function public.guard_claim();

/* ============================================================
   Server-side actions
   ============================================================ */

create sequence public.student_number_seq;

-- Finance confirms or rejects a payment. Confirming records the transaction, updates the
-- course balance and, for the registration fee, issues a student number.
create or replace function public.review_payment(claim_id uuid, decision text, reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  c public.payment_claims;
  reviewer text;
  what text;
begin
  if not public.is_staff(array['finance']) then raise exception 'Only Finance can review payments'; end if;
  if decision not in ('confirmed', 'rejected') then raise exception 'Unknown decision'; end if;
  select * into c from public.payment_claims where id = claim_id for update;
  if c.id is null or c.status <> 'pending' then raise exception 'This payment was already reviewed'; end if;
  select name into reviewer from public.profiles where id = auth.uid();

  update public.payment_claims
     set status = decision, reviewed_by = reviewer, reviewed_at = now(),
         rejection_reason = case when decision = 'rejected' then reason end
   where id = claim_id;

  what := case c.purpose when 'registration' then 'Registration fee'
                         when 'certificate' then 'Certificate fee (' || coalesce(c.course_name, '') || ')'
                         else 'Course fee (' || coalesce(c.course_name, '') || ')' end;

  if decision = 'confirmed' then
    insert into public.transactions (id, student_id, amount, description, type)
    values (c.id, c.student_id, c.amount,
            case c.purpose when 'registration' then 'Registration Fee - Alphatech Computer Institute'
                           when 'certificate' then 'Certificate Fee: ' || coalesce(c.course_name, '')
                           else 'Course Fee: ' || coalesce(c.course_name, '') end,
            case when c.purpose = 'registration' then 'registration' else 'course_fee' end);
    if c.purpose = 'course_fee' then
      update public.enrollments set amount_paid = least(total_amount, amount_paid + c.amount)
       where student_id = c.student_id and course_id = c.course_id;
    end if;
    if c.purpose = 'registration' then
      perform set_config('app.trusted', 'on', true);
      update public.profiles
         set student_number = 'ATC-' || extract(year from now())::int || '-' || lpad(nextval('public.student_number_seq')::text, 4, '0')
       where id = c.student_id and student_number is null;
      perform set_config('app.trusted', 'off', true);
    end if;
    insert into public.notifications (type, title, message, user_id, recipient_role)
    values ('payment_confirmed', 'Payment confirmed', what || ': K ' || to_char(c.amount, 'FM999,999,990') || ' received. Thank you.', c.student_id, 'student');
  else
    insert into public.notifications (type, title, message, user_id, recipient_role)
    values ('payment_rejected', 'Payment not confirmed',
            what || ' (ref ' || c.reference || ') could not be matched' || coalesce(': ' || nullif(reason, ''), '') || '. Please check and resubmit.',
            c.student_id, 'student');
  end if;
end $$;

-- A student submits an exam. Objective questions are marked here, on the server.
create or replace function public.submit_exam_attempt(attempt_id uuid, auto_submit boolean default false)
returns public.exam_attempts language plpgsql security definer set search_path = public as $$
declare
  a public.exam_attempts;
  e public.exams;
  k jsonb;
  q jsonb;
  ans text;
  correct text;
  auto numeric := 0;
  waiting boolean := false;
begin
  select * into a from public.exam_attempts where id = attempt_id for update;
  if a.id is null or a.student_id <> auth.uid() then raise exception 'Exam attempt not found'; end if;
  if a.is_submitted then return a; end if;
  select * into e from public.exams where id = a.exam_id;
  select answers into k from public.exam_keys where exam_id = e.id;
  k := coalesce(k, '{}'::jsonb);

  for q in select * from jsonb_array_elements(e.questions) loop
    ans := a.answers ->> (q ->> 'id');
    correct := k ->> (q ->> 'id');
    if (q ->> 'type') <> 'essay' and coalesce(correct, '') <> '' then
      if ans is not null and lower(regexp_replace(trim(ans), '\s+', ' ', 'g')) = lower(regexp_replace(trim(correct), '\s+', ' ', 'g')) then
        auto := auto + coalesce((q ->> 'marks')::numeric, 0);
      end if;
    elsif coalesce(trim(ans), '') <> '' then
      waiting := true;
    end if;
  end loop;

  perform set_config('app.trusted', 'on', true);
  update public.exam_attempts
     set is_submitted = true, is_auto_submitted = auto_submit, end_time = now(),
         auto_score = auto, needs_marking = waiting, score = case when waiting then null else auto end
   where id = attempt_id
  returning * into a;
  perform set_config('app.trusted', 'off', true);
  return a;
end $$;

-- Lecturers see the answer key when building and marking; students never do.
create or replace function public.save_exam_key(exam uuid, key jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_staff() or exists (select 1 from public.exams where id = exam and lecturer_id = auth.uid())) then
    raise exception 'Only the lecturer can set the answers';
  end if;
  insert into public.exam_keys (exam_id, answers) values (exam, key)
  on conflict (exam_id) do update set answers = excluded.answers;
end $$;

/* ============================================================
   Row level security
   ============================================================ */

alter table public.app_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.student_details enable row level security;
alter table public.staff_invites enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.timetable enable row level security;
alter table public.live_classes enable row level security;
alter table public.recordings enable row level security;
alter table public.homeworks enable row level security;
alter table public.homework_submissions enable row level security;
alter table public.exams enable row level security;
alter table public.exam_keys enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.payment_claims enable row level security;
alter table public.transactions enable row level security;
alter table public.certificates enable row level security;
alter table public.attendance enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;
alter table public.activity_logs enable row level security;

-- app_settings: admin only
create policy "admin reads settings" on public.app_settings for select to authenticated using (public.is_staff(array['admin']));
create policy "admin edits settings" on public.app_settings for update to authenticated using (public.is_staff(array['admin']));

-- profiles
create policy "see yourself" on public.profiles for select to authenticated using (id = auth.uid());
create policy "staff see everyone" on public.profiles for select to authenticated using (public.is_staff());
create policy "everyone sees lecturers and staff" on public.profiles for select to authenticated using (role in ('lecturer', 'staff'));
create policy "lecturers see their students" on public.profiles for select to authenticated using (public.teaches_student(id));
create policy "edit yourself" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "registrar edits people" on public.profiles for update to authenticated using (public.is_staff(array['registrar']));

-- student_details
create policy "own details" on public.student_details for select to authenticated using (id = auth.uid() or public.is_staff());
create policy "add own details" on public.student_details for insert to authenticated with check (id = auth.uid());
create policy "edit own details" on public.student_details for update to authenticated using (id = auth.uid() or public.is_staff(array['registrar']));

-- staff_invites
create policy "admin manages invites" on public.staff_invites for all to authenticated
  using (public.is_staff(array['admin'])) with check (public.is_staff(array['admin']));

-- courses: the catalogue is public
create policy "anyone reads courses" on public.courses for select to anon, authenticated using (true);
create policy "registrar manages courses" on public.courses for all to authenticated
  using (public.is_staff(array['registrar'])) with check (public.is_staff(array['registrar']));

-- enrollments
create policy "see enrolments" on public.enrollments for select to authenticated
  using (student_id = auth.uid() or public.is_staff() or public.teaches_course(course_id));
create policy "students enrol themselves" on public.enrollments for insert to authenticated
  with check (student_id = auth.uid() and public.my_role() = 'student'
              and exists (select 1 from public.profiles where id = auth.uid() and student_number is not null));
create policy "registrar manages enrolments" on public.enrollments for all to authenticated
  using (public.is_staff(array['registrar'])) with check (public.is_staff(array['registrar']));

-- teaching tables: enrolled students read; the course lecturer and staff write
create policy "read timetable" on public.timetable for select to authenticated
  using (public.is_staff() or public.teaches_course(course_id) or public.is_enrolled(course_id));
create policy "write timetable" on public.timetable for all to authenticated
  using (public.is_staff(array['registrar']) or public.teaches_course(course_id))
  with check (public.is_staff(array['registrar']) or public.teaches_course(course_id));

create policy "read live classes" on public.live_classes for select to authenticated
  using (public.is_staff() or public.teaches_course(course_id) or public.is_enrolled(course_id));
create policy "write live classes" on public.live_classes for all to authenticated
  using (public.is_staff(array['registrar']) or public.teaches_course(course_id))
  with check (public.is_staff(array['registrar']) or public.teaches_course(course_id));

create policy "read recordings" on public.recordings for select to authenticated
  using (public.is_staff() or public.teaches_course(course_id) or public.is_enrolled(course_id));
create policy "write recordings" on public.recordings for all to authenticated
  using (public.is_staff(array['registrar']) or public.teaches_course(course_id))
  with check (public.is_staff(array['registrar']) or public.teaches_course(course_id));

create policy "read homeworks" on public.homeworks for select to authenticated
  using (public.is_staff() or public.teaches_course(course_id) or public.is_enrolled(course_id));
create policy "write homeworks" on public.homeworks for all to authenticated
  using (public.is_staff(array['registrar']) or public.teaches_course(course_id))
  with check (public.is_staff(array['registrar']) or public.teaches_course(course_id));

create policy "read submissions" on public.homework_submissions for select to authenticated
  using (student_id = auth.uid() or public.is_staff()
         or exists (select 1 from public.homeworks h where h.id = homework_id and public.teaches_course(h.course_id)));
create policy "students submit" on public.homework_submissions for insert to authenticated
  with check (student_id = auth.uid()
              and exists (select 1 from public.homeworks h where h.id = homework_id and public.is_enrolled(h.course_id)));
create policy "lecturers mark" on public.homework_submissions for update to authenticated
  using (exists (select 1 from public.homeworks h where h.id = homework_id and public.teaches_course(h.course_id)) or public.is_staff(array['registrar']));

-- exams: students only see published exams for their courses
create policy "read exams" on public.exams for select to authenticated
  using (public.is_staff() or public.teaches_course(course_id) or (is_published and public.is_enrolled(course_id)));
create policy "write exams" on public.exams for all to authenticated
  using (public.is_staff(array['registrar']) or public.teaches_course(course_id))
  with check (public.is_staff(array['registrar']) or public.teaches_course(course_id));

create policy "lecturers read keys" on public.exam_keys for select to authenticated
  using (public.is_staff() or exists (select 1 from public.exams e where e.id = exam_id and public.teaches_course(e.course_id)));

create policy "read attempts" on public.exam_attempts for select to authenticated
  using (student_id = auth.uid() or public.is_staff()
         or exists (select 1 from public.exams e where e.id = exam_id and public.teaches_course(e.course_id)));
create policy "students start exams" on public.exam_attempts for insert to authenticated
  with check (student_id = auth.uid() and exists (select 1 from public.exams e where e.id = exam_id and public.is_enrolled(e.course_id)));
create policy "students save answers" on public.exam_attempts for update to authenticated
  using (student_id = auth.uid() and not is_submitted);
create policy "lecturers mark exams" on public.exam_attempts for update to authenticated
  using (public.is_staff(array['registrar']) or exists (select 1 from public.exams e where e.id = exam_id and public.teaches_course(e.course_id)));
create policy "lecturers remove attempts" on public.exam_attempts for delete to authenticated
  using (public.is_staff(array['registrar']) or exists (select 1 from public.exams e where e.id = exam_id and public.teaches_course(e.course_id)));

-- payments
create policy "read claims" on public.payment_claims for select to authenticated
  using (student_id = auth.uid() or public.is_staff(array['finance', 'registrar']));
create policy "students submit claims" on public.payment_claims for insert to authenticated
  with check (student_id = auth.uid() and public.my_role() = 'student');

create policy "read transactions" on public.transactions for select to authenticated
  using (student_id = auth.uid() or public.is_staff(array['finance', 'registrar']));

-- certificates
create policy "read certificates" on public.certificates for select to authenticated
  using (student_id = auth.uid() or public.is_staff() or issuer_id = auth.uid());
create policy "issue certificates" on public.certificates for insert to authenticated
  with check (public.is_staff(array['registrar']) or (issuer_id = auth.uid() and public.teaches_student(student_id)));

-- attendance
create policy "read attendance" on public.attendance for select to authenticated
  using (student_id = auth.uid() or public.is_staff() or public.teaches_course(course_id));
create policy "students check in" on public.attendance for insert to authenticated
  with check ((student_id = auth.uid() and marked_by = 'auto' and public.is_enrolled(course_id)
               and exists (select 1 from public.live_classes l where l.id = live_class_id and l.course_id = attendance.course_id))
              or public.teaches_course(course_id) or public.is_staff(array['registrar']));
create policy "lecturers correct register" on public.attendance for delete to authenticated
  using (public.teaches_course(course_id) or public.is_staff(array['registrar']));

-- announcements
create policy "read announcements" on public.announcements for select to authenticated
  using (public.is_staff() or audience = 'all'
         or (audience = 'students' and public.my_role() = 'student')
         or (audience = 'lecturers' and public.my_role() = 'lecturer')
         or (audience = 'course' and (public.is_enrolled(course_id) or public.teaches_course(course_id))));
create policy "staff post announcements" on public.announcements for all to authenticated
  using (public.is_staff(array['registrar'])) with check (public.is_staff(array['registrar']));

-- notifications
create policy "read notifications" on public.notifications for select to authenticated
  using (user_id = auth.uid()
         or (user_id is null and (
              recipient_role = 'all'
              or (recipient_role = 'student' and public.my_role() = 'student' and (course_id is null or public.is_enrolled(course_id)))
              or (recipient_role = 'lecturer' and public.my_role() = 'lecturer'))));
create policy "teachers and staff notify" on public.notifications for insert to authenticated
  with check (public.my_role() in ('lecturer', 'staff'));

create policy "own read marks" on public.notification_reads for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- activity
create policy "log own activity" on public.activity_logs for insert to authenticated with check (user_id = auth.uid());
create policy "read activity" on public.activity_logs for select to authenticated using (user_id = auth.uid() or public.is_staff());

/* ============================================================
   Grants and live updates
   ============================================================ */

grant usage on schema public to anon, authenticated;
grant select on public.courses to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on sequence public.student_number_seq to authenticated;
revoke execute on function public.review_payment(uuid, text, text) from anon;
revoke execute on function public.submit_exam_attempt(uuid, boolean) from anon;
revoke execute on function public.save_exam_key(uuid, jsonb) from anon;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table
      public.profiles, public.courses, public.enrollments, public.live_classes, public.homeworks,
      public.homework_submissions, public.exams, public.exam_attempts, public.payment_claims,
      public.attendance, public.announcements, public.notifications, public.recordings, public.timetable,
      public.certificates, public.transactions;
  end if;
end $$;
