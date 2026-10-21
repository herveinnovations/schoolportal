-- Trigger functions run automatically; nobody needs to call them directly.
revoke execute on function public.enrollment_defaults(), public.guard_attempt(), public.guard_claim(),
  public.guard_profile(), public.guard_submission(), public.handle_new_user()
  from public, anon, authenticated;

-- Helpers and actions: signed-in users only (each one checks who is calling).
revoke execute on function public.my_role(), public.my_staff_role(), public.is_staff(text[]),
  public.teaches_course(uuid), public.is_enrolled(uuid), public.teaches_student(uuid),
  public.review_payment(uuid, text, text), public.submit_exam_attempt(uuid, boolean), public.save_exam_key(uuid, jsonb)
  from public, anon;
grant execute on function public.my_role(), public.my_staff_role(), public.is_staff(text[]),
  public.teaches_course(uuid), public.is_enrolled(uuid), public.teaches_student(uuid),
  public.review_payment(uuid, text, text), public.submit_exam_attempt(uuid, boolean), public.save_exam_key(uuid, jsonb)
  to authenticated;
