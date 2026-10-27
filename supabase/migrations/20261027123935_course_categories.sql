-- Course categories from the official enrolment form
alter table public.courses drop constraint if exists courses_level_check;
alter table public.courses add constraint courses_level_check
  check (level in ('beginner', 'office', 'teveta_level_3', 'short', 'advanced', 'refresher'));
