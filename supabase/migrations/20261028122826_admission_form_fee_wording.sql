-- Call the K170 fee the admission form fee, as on the official enrolment form
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

  what := case c.purpose when 'registration' then 'Admission form fee'
                         when 'certificate' then 'Certificate fee (' || coalesce(c.course_name, '') || ')'
                         else 'Course fee (' || coalesce(c.course_name, '') || ')' end;

  if decision = 'confirmed' then
    insert into public.transactions (id, student_id, amount, description, type)
    values (c.id, c.student_id, c.amount,
            case c.purpose when 'registration' then 'Admission Form Fee - Alphatech Computer Institute'
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
