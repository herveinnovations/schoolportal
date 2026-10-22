# Alphatech Computer Institute portal

One portal for students, lecturers and staff: live classes, recordings, assignments, timed exams, marking, gradebook, attendance, payments and certificates.

- **Website:** React + Vite, hosted on Vercel at https://alphatechonlinelearning.vercel.app (every push to `main` deploys automatically).
- **Database and logins:** Supabase (`supabase/migrations`, `supabase/functions/invite-user`).

## How access works

| Who | How they get an account | What they can do |
|---|---|---|
| Student | Signs up on the website, confirms email, pays the K170 registration fee | Their own courses, classes, work, results and payments |
| Lecturer | Invited by an administrator (Staff & access page) | Only the courses assigned to them |
| Registrar (staff) | Invited | Students, courses, lecturers, results, certificates, announcements |
| Finance (staff) | Invited | Confirms or rejects payments, sees balances |
| Administrator (staff) | The owner email in `app_settings`, or invited | Everything, including inviting people and switching accounts off |

Everyone signs in on the same page; the account decides which portal opens. The rules are enforced in the database (row level security), not just in the screens.

## One-time setup

> Done on 21 Oct 2026: the tables, security rules and the `invite-user` function are already set up in the School Portal Supabase project. Steps 1–2 are only needed for a new project.

1. **Create the database.** Either:
   - Supabase dashboard → SQL Editor → paste each file in `supabase/migrations` in order → Run, **or**
   - add the repository secrets `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` and run the **Deploy database** workflow (it also deploys the invite function).

   The first administrator is the email in the `owner_email` line near the top of that file. Change it before running if needed.

2. **Deploy the invite function** (skip if the workflow did it): `supabase functions deploy invite-user --no-verify-jwt`.

3. **Tell Supabase where the site lives.** Dashboard → Authentication → URL Configuration:
   - Site URL: `https://alphatechonlinelearning.vercel.app`
   - Redirect URLs: add `https://alphatechonlinelearning.vercel.app/**`

   Without this, confirmation, invite and reset emails send people to the wrong address.

4. **Email.** Supabase’s built-in email sender is limited to a few emails an hour. Before launch, add your own SMTP (Authentication → Emails → SMTP settings).

5. **Payment details.** Replace the placeholder MTN, Airtel and bank numbers in `src/app/config/school.ts`.

6. Sign up on the site with the owner email, confirm it, and you land in the Staff portal as Administrator. Invite lecturers and staff from **Staff & access**, then add courses.

## Running locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Live classes

Lecturers paste a Zoom, Google Meet or Jitsi link when scheduling a class. Students join from the portal, which records attendance. Recordings are added as links (YouTube unlisted, Google Drive or Zoom cloud).
