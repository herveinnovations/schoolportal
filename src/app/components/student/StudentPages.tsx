import React, { useMemo, useState } from 'react';
import { schoolLogo, Logo } from '../BrandMark';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Video, CalendarDays, MapPin, Clock, ExternalLink, PlayCircle, ClipboardCheck, FileText, GraduationCap, Award, Printer, Hourglass, KeyRound, Upload } from 'lucide-react';
import { SectionTitle, EmptyState, StatusPill, Segmented, countdown, fmtDate, DAYS, nextOccurrence } from '../shell/ui';
import { courseMark, letter, letterTone, examMax, percent } from '@/app/lib/academics';
import { FEES } from '@/app/config/school';
import { PasswordInput } from '../AuthShell';

/* ---------------- Live classes ---------------- */

export const StudentLive: React.FC<{ onJoin: (id: string) => void }> = ({ onJoin }) => {
  const { user, liveClasses, recordings, attendance } = useAuth();
  if (!user) return null;
  const now = new Date();
  const mine = liveClasses.filter(l => user.courses.includes(l.courseId));
  const live = mine.filter(l => l.isLive);
  const upcoming = mine.filter(l => !l.isLive && new Date(l.scheduledTime) > now).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  const past = mine.filter(l => !l.isLive && new Date(l.scheduledTime) <= now).sort((a, b) => b.scheduledTime.localeCompare(a.scheduledTime));

  if (mine.length === 0) return <EmptyState icon={Video} title="No live classes yet" text="When your lecturers schedule a live class, it shows here with a Join button." />;

  return (
    <div className="space-y-8">
      {live.length > 0 && (
        <section className="space-y-3">
          {live.map(l => (
            <motion.div key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white p-5 sm:p-6 flex flex-wrap items-center gap-4 shadow-lg">
              <span className="relative flex w-3 h-3"><span className="absolute inset-0 rounded-full bg-white animate-ping opacity-75" /><span className="relative w-3 h-3 rounded-full bg-white" /></span>
              <div className="flex-1 min-w-[180px]">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-100">Live now</p>
                <p className="text-lg font-bold">{l.courseName}</p>
                <p className="text-sm text-red-100">with {l.lecturerName}</p>
              </div>
              <Button className="bg-white text-red-700 hover:bg-red-50 h-11 px-6" onClick={() => onJoin(l.id)}><Video className="w-4 h-4" />Join class</Button>
            </motion.div>
          ))}
        </section>
      )}

      <section>
        <SectionTitle title="Coming up" />
        {upcoming.length === 0 ? <p className="text-sm text-stone-500">No live classes scheduled yet.</p> : (
          <div className="grid gap-3">
            {upcoming.map(l => (
              <div key={l.id} className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-wrap items-center gap-4">
                <div className="w-14 text-center shrink-0">
                  <p className="text-xs font-semibold uppercase text-emerald-700">{new Date(l.scheduledTime).toLocaleDateString(undefined, { month: 'short' })}</p>
                  <p className="text-2xl font-bold text-stone-900 leading-none">{new Date(l.scheduledTime).getDate()}</p>
                </div>
                <div className="flex-1 min-w-[160px]">
                  <p className="font-semibold text-stone-900">{l.courseName}</p>
                  <p className="text-sm text-stone-500">{fmtDate(l.scheduledTime, true)} · {l.lecturerName}</p>
                </div>
                <StatusPill tone="emerald"><Clock className="w-3 h-3" />{countdown(new Date(l.scheduledTime))}</StatusPill>
              </div>
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <SectionTitle title="Past classes" />
          <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
            {past.map(l => {
              const rec = recordings.find(r => r.courseId === l.courseId && Math.abs(new Date(r.recordingDate).getTime() - new Date(l.scheduledTime).getTime()) < 3 * 86400000);
              const attended = attendance.some(a => a.liveClassId === l.id && a.studentId === user.id);
              return (
                <div key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-[160px]">
                    <p className="font-medium text-stone-900">{l.courseName}</p>
                    <p className="text-xs text-stone-500">{fmtDate(l.scheduledTime, true)}</p>
                  </div>
                  {attended ? <StatusPill tone="green">Attended</StatusPill> : <StatusPill tone="stone">Missed</StatusPill>}
                  {rec && /^https?:/.test(rec.recordingUrl) && <a href={rec.recordingUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-emerald-700 inline-flex items-center gap-1"><PlayCircle className="w-4 h-4" />Recording</a>}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

/* ---------------- Timetable / calendar ---------------- */

export const StudentSchedule: React.FC<{ go: (tab: string) => void }> = ({ go }) => {
  const { user, timetable, liveClasses, exams, homeworks } = useAuth();
  const [view, setView] = useState<'week' | 'agenda'>('week');
  if (!user) return null;
  const now = new Date();
  const today = DAYS[now.getDay()];
  const slots = timetable.filter(t => user.courses.includes(t.courseId));
  const week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const horizon = now.getTime() + 21 * 86400000;
  const agenda = [
    ...slots.map(t => ({ when: nextOccurrence(t.day, t.time, now)!, title: t.courseName, sub: `${t.time} · ${t.room}`, kind: 'class' as const })),
    ...liveClasses.filter(l => user.courses.includes(l.courseId) && new Date(l.scheduledTime) >= now).map(l => ({ when: new Date(l.scheduledTime), title: `Live: ${l.courseName}`, sub: l.lecturerName, kind: 'live' as const })),
    ...exams.filter(e => user.courses.includes(e.courseId) && e.isPublished && new Date(e.scheduledDate) >= now).map(e => ({ when: new Date(e.scheduledDate), title: e.title, sub: `${e.courseName} · ${e.duration} min`, kind: 'exam' as const })),
    ...homeworks.filter(h => user.courses.includes(h.courseId) && new Date(h.dueDate) >= now).map(h => ({ when: new Date(h.dueDate), title: `Due: ${h.title}`, sub: h.courseName, kind: 'due' as const })),
  ].filter(x => x.when && x.when.getTime() <= horizon).sort((a, b) => a.when.getTime() - b.when.getTime());

  const kindStyle = { class: 'bg-emerald-100 text-emerald-800', live: 'bg-red-100 text-red-700', exam: 'bg-amber-100 text-amber-800', due: 'bg-stone-100 text-stone-700' };
  const kindIcon = { class: <CalendarDays className="w-4 h-4" />, live: <Video className="w-4 h-4" />, exam: <ClipboardCheck className="w-4 h-4" />, due: <FileText className="w-4 h-4" /> };

  if (!user.courses.length) return <EmptyState icon={CalendarDays} title="No timetable yet" text="Enrol in a course and its classes appear here." action={<Button onClick={() => go('courses')}>Browse courses</Button>} />;

  return (
    <div className="space-y-5">
      <Segmented id="sched" value={view} onChange={setView} options={[['week', 'Weekly classes'], ['agenda', 'Next 3 weeks']]} />
      {view === 'week' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {week.map(d => {
            const items = slots.filter(s => s.day === d).sort((a, b) => a.time.localeCompare(b.time));
            const isToday = d === today;
            return (
              <div key={d} className={`rounded-2xl border p-3 min-h-[120px] ${isToday ? 'border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-200' : 'border-stone-200 bg-white'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isToday ? 'text-emerald-800' : 'text-stone-500'}`}>{d.slice(0, 3)}{isToday && ' · Today'}</p>
                {items.length === 0 ? <p className="text-xs text-stone-400">No classes</p> : (
                  <ul className="space-y-2">
                    {items.map(s => (
                      <li key={s.id} className="rounded-xl bg-white border border-stone-200 p-2.5 shadow-sm">
                        <p className="text-xs font-semibold text-emerald-800 tabular-nums">{s.time}</p>
                        <p className="text-sm font-medium text-stone-900 leading-snug">{s.courseName}</p>
                        <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{s.room}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ) : agenda.length === 0 ? <EmptyState icon={CalendarDays} title="Nothing in the next 3 weeks" text="Classes, exams and due dates will show here." /> : (
        <ol className="relative border-l-2 border-stone-200 ml-3 space-y-4">
          {agenda.map((a, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }} className="pl-6 relative">
              <span className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-stone-50 ${kindStyle[a.kind]}`}>{kindIcon[a.kind]}</span>
              <p className="text-xs text-stone-500">{fmtDate(a.when, true)} · {countdown(a.when)}</p>
              <p className="font-semibold text-stone-900">{a.title}</p>
              <p className="text-sm text-stone-500">{a.sub}</p>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  );
};

/* ---------------- Results / transcript ---------------- */

export const StudentResults: React.FC = () => {
  const { user, courses, homeworks, homeworkSubmissions, exams, examAttempts } = useAuth();
  if (!user) return null;
  const mine = courses.filter(c => user.courses.includes(c.id));
  if (!mine.length) return <EmptyState icon={GraduationCap} title="No results yet" text="Enrol in a course. Your marks appear here as your work is graded." />;

  const rows = mine.map(c => {
    const hw = homeworks.filter(h => h.courseId === c.id);
    const graded = hw.map(h => homeworkSubmissions.find(s => s.homeworkId === h.id && s.studentId === user.id)).filter(s => s?.grade !== undefined);
    const ex = exams.filter(e => e.courseId === c.id);
    const marked = ex.map(e => ({ e, a: examAttempts.find(a => a.examId === e.id && a.studentId === user.id) })).filter(x => x.a?.isSubmitted && !x.a.needsMarking && x.a.score !== undefined);
    const overall = courseMark(c.id, user.id, homeworks, homeworkSubmissions, exams, examAttempts);
    return { c, graded: graded.length, hwTotal: hw.length, examPct: marked.length ? Math.round(marked.reduce((s, x) => s + percent(x.a!.score!, examMax(x.e)), 0) / marked.length) : undefined, overall };
  });
  const credits = mine.reduce((s, c) => s + c.credits, 0);
  const passedCredits = rows.filter(r => (r.overall ?? 0) >= FEES.passMark).reduce((s, r) => s + r.c.credits, 0);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-wrap gap-6">
        <div><p className="text-sm text-stone-500">Student</p><p className="font-semibold text-stone-900">{user.name}</p></div>
        <div><p className="text-sm text-stone-500">Student no.</p><p className="font-semibold text-stone-900">{user.studentNumber ?? 'Pending'}</p></div>
        <div><p className="text-sm text-stone-500">Programme</p><p className="font-semibold text-stone-900">{user.personalDetails?.program || 'Certificate courses'}</p></div>
        <div><p className="text-sm text-stone-500">Credits passed</p><p className="font-semibold text-stone-900 tabular-nums">{passedCredits} of {credits}</p></div>
      </div>
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-stone-50 text-stone-600">
            <tr>
              <th scope="col" className="text-left font-semibold px-5 py-3">Course</th>
              <th scope="col" className="text-left font-semibold px-3 py-3">Credits</th>
              <th scope="col" className="text-left font-semibold px-3 py-3">Assignments</th>
              <th scope="col" className="text-left font-semibold px-3 py-3">Exams</th>
              <th scope="col" className="text-left font-semibold px-3 py-3">Overall</th>
              <th scope="col" className="text-left font-semibold px-5 py-3">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 tabular-nums">
            {rows.map(r => (
              <tr key={r.c.id}>
                <td className="px-5 py-3.5 font-medium text-stone-900">{r.c.name}</td>
                <td className="px-3 py-3.5">{r.c.credits}</td>
                <td className="px-3 py-3.5 text-stone-600">{r.graded} of {r.hwTotal} marked</td>
                <td className="px-3 py-3.5 text-stone-600">{r.examPct !== undefined ? `${r.examPct}%` : '—'}</td>
                <td className="px-3 py-3.5 font-semibold">{r.overall !== undefined ? `${r.overall}%` : '—'}</td>
                <td className="px-5 py-3.5">{r.overall !== undefined ? <span className={`font-bold ${letterTone(r.overall)}`}>{letter(r.overall)}</span> : <StatusPill tone="stone">In progress</StatusPill>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-stone-500">Overall is the average of your marked assignments and exams. Grades: A+ 86–100, A 76–85, B+ 66–75, B 56–65, C+ 50–55, C 40–49, D below 40. Pass mark {FEES.passMark}%.</p>
      <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4" />Print results slip</Button>
    </div>
  );
};

/* ---------------- Certificates ---------------- */

export const StudentCertificates: React.FC<{ go: (tab: string) => void }> = ({ go }) => {
  const { user, exams, examAttempts, paymentClaims } = useAuth();
  if (!user) return null;
  const passed = examAttempts
    .filter(a => a.studentId === user.id && a.isSubmitted && !a.needsMarking && a.score !== undefined)
    .map(a => ({ a, e: exams.find(e => e.id === a.examId)! }))
    .filter(x => x.e && percent(x.a.score!, examMax(x.e)) >= FEES.passMark);
  const issued = user.certificates ?? [];

  if (!passed.length && !issued.length) return <EmptyState icon={Award} title="No certificates yet" text={`Pass a course exam (${FEES.passMark}% or more) and you can get a certificate for K ${FEES.certificate}.`} action={<Button variant="outline" onClick={() => go('exams')}>Go to exams</Button>} />;

  return (
    <div className="space-y-8">
      {passed.length > 0 && (
        <section>
          <SectionTitle title="From your exams" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {passed.map(({ a, e }) => {
              const paid = user.transactions?.some(t => t.description === `Certificate Fee: ${e.courseName}`);
              const pending = paymentClaims.some(c => c.studentId === user.id && c.purpose === 'certificate' && c.courseName === e.courseName && c.status === 'pending');
              return (
                <div key={a.id} className="bg-white rounded-2xl border border-stone-200 p-5 text-center shadow-sm">
                  <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-3"><Award className="w-6 h-6" /></div>
                  <p className="font-semibold text-stone-900">{e.courseName}</p>
                  <p className="text-xs text-stone-500 mb-4">{percent(a.score!, examMax(e))}% · {fmtDate(a.endTime!)}</p>
                  {paid ? <Button className="w-full" onClick={() => go('exams')}>View certificate</Button>
                    : pending ? <StatusPill tone="amber"><Hourglass className="w-3 h-3" />Payment pending</StatusPill>
                    : <Button variant="outline" className="w-full" onClick={() => go('exams')}>Get certificate (K {FEES.certificate})</Button>}
                </div>
              );
            })}
          </div>
        </section>
      )}
      {issued.length > 0 && (
        <section>
          <SectionTitle title="Issued by Alphatech Computer Institute" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {issued.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-stone-200 p-5 text-center shadow-sm">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3"><Award className="w-6 h-6" /></div>
                <p className="font-semibold text-stone-900">{c.title}</p>
                <p className="text-xs text-stone-500 mb-4">Issued {fmtDate(c.issueDate)} by {c.issuerName}</p>
                {c.fileUrl ? <a href={c.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700"><ExternalLink className="w-4 h-4" />Open</a> : null}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

/* ---------------- Profile ---------------- */

export const StudentProfile: React.FC = () => {
  const { user, updateUser, changePassword } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [photo, setPhoto] = useState(user?.profilePicture ?? '');
  const [phone, setPhone] = useState(user?.personalDetails?.phoneNumber ?? '');
  const [address, setAddress] = useState(user?.personalDetails?.residentialAddress ?? '');
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const initials = useMemo(() => (user?.name ?? '').split(' ').map(p => p[0]).slice(0, 2).join(''), [user?.name]);
  if (!user) return null;

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1.5 * 1024 * 1024) { toast.error('Choose a photo under 1.5 MB'); return; }
    const r = new FileReader();
    r.onloadend = () => setPhoto(r.result as string);
    r.readAsDataURL(f);
  };

  const save = () => {
    updateUser({ name: name.trim() || user.name, bio, profilePicture: photo, personalDetails: { ...(user.personalDetails ?? {} as never), phoneNumber: phone, residentialAddress: address, address } });
    toast.success('Profile saved');
  };

  const changePw = () => {
    if (!pw.current) return void toast.error('Enter your current password');
    if (pw.next.length < 6) { toast.error('Use at least 6 characters for the new password'); return; }
    if (pw.next !== pw.confirm) { toast.error('The new passwords don’t match'); return; }
    changePassword(pw.current, pw.next).then(err => { if (err) toast.error(err); else { setPw({ current: '', next: '', confirm: '' }); toast.success('Password changed'); } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start">
      {/* Digital student ID */}
      <motion.div initial={{ opacity: 0, rotateX: 8 }} animate={{ opacity: 1, rotateX: 0 }} className="overflow-hidden shadow-xl bg-ink text-white border-t-4 border-sun">
        <div className="p-5 flex items-center justify-between">
          <Logo height={34} plate className="!px-2 !py-1.5" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sun">Student ID</p>
        </div>
        <div className="px-5 pb-5 flex items-center gap-4">
          <Avatar className="w-20 h-20 ring-4 ring-white/20">
            <AvatarImage src={photo} />
            <AvatarFallback className="bg-emerald-600 text-white text-xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-bold text-lg leading-tight">{user.name}</p>
            <p className="text-sm text-emerald-100">{user.personalDetails?.program || 'Student'}</p>
            <p className="mt-2 font-mono text-amber-300 font-semibold">{user.studentNumber ?? 'Number pending'}</p>
          </div>
        </div>
        <div className="bg-black/20 px-5 py-3 text-xs text-emerald-100 flex justify-between">
          <span>{user.email}</span><span>Valid {new Date().getFullYear()}</span>
        </div>
      </motion.div>

      <div className="space-y-6">
        <section className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6 space-y-4">
          <h3 className="font-bold text-stone-900">Your details</h3>
          <div className="flex items-center gap-3">
            <Label htmlFor="photo" className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-sm hover:bg-stone-50"><Upload className="w-4 h-4" />Change photo</Label>
            <input id="photo" type="file" accept="image/*" className="sr-only" onChange={onPhoto} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label htmlFor="p-name">Full name</Label><Input id="p-name" value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="p-phone">Phone</Label><Input id="p-phone" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="p-address">Residential address</Label><Input id="p-address" value={address} onChange={e => setAddress(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="p-bio">About you</Label><Textarea id="p-bio" rows={3} value={bio} onChange={e => setBio(e.target.value)} /></div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div><p className="text-stone-500">Email</p><p className="font-medium">{user.email}</p></div>
            <div><p className="text-stone-500">NRC / passport</p><p className="font-medium">{user.personalDetails?.nrcNumber || user.personalDetails?.passportNumber || '—'}</p></div>
          </div>
          <Button onClick={save}>Save changes</Button>
        </section>

        <section className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6 space-y-4">
          <h3 className="font-bold text-stone-900 flex items-center gap-2"><KeyRound className="w-4 h-4" />Change password</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label htmlFor="pw-cur">Current password</Label><PasswordInput id="pw-cur" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="pw-new">New password</Label><PasswordInput id="pw-new" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="pw-conf">Confirm new password</Label><PasswordInput id="pw-conf" value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} /></div>
          </div>
          <Button variant="outline" onClick={changePw}>Update password</Button>
        </section>
      </div>
    </div>
  );
};
