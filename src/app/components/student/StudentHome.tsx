import React from 'react';
import { motion } from 'motion/react';
import { useAuth, type Course } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Video, FileText, ClipboardCheck, CalendarClock, AlertTriangle, Hourglass, ArrowRight, Megaphone, FileCheck2, CheckCircle2, Sparkles } from 'lucide-react';
import { ProgressRing, StatusPill, countdown, fmtDate, greeting, nextOccurrence } from '../shell/ui';
import { courseProgress } from '@/app/lib/academics';
import { studentFinance, kwacha } from '@/app/lib/finance';
import { timeAgo } from '../shell/NotificationBell';

interface Props {
  go: (tab: string) => void;
  openCourse: (c: Course) => void;
  onRegister: () => void;
  onResubmitRegistration: () => void;
  onPay: (courseId: string, amount: number) => void;
  onJoin: (liveClassId: string) => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

export const StudentHome: React.FC<Props> = ({ go, openCourse, onRegister, onResubmitRegistration, onPay, onJoin }) => {
  const { user, courses, liveClasses, timetable, homeworks, homeworkSubmissions, exams, examAttempts, paymentClaims, announcements } = useAuth();
  if (!user) return null;
  const now = new Date();
  const mine = courses.filter(c => user.courses.includes(c.id));
  const fin = studentFinance(user, paymentClaims);
  const registered = !!user.personalDetails?.hasCompletedRegistration;

  // Next up: a live class now, then the soonest scheduled class or timetable slot
  const myLive = liveClasses.filter(l => user.courses.includes(l.courseId));
  const liveNow = myLive.find(l => l.isLive);
  const nextScheduled = [
    ...myLive.filter(l => !l.isLive && new Date(l.scheduledTime) > now).map(l => ({ when: new Date(l.scheduledTime), title: l.courseName, where: 'Live online class', id: l.id })),
    ...timetable.filter(t => user.courses.includes(t.courseId)).map(t => ({ when: nextOccurrence(t.day, t.time, now)!, title: t.courseName, where: t.room, id: t.id })).filter(x => x.when),
  ].sort((a, b) => a.when.getTime() - b.when.getTime())[0];

  // To do: unsubmitted assignments and open exams
  const todo = [
    ...homeworks.filter(h => user.courses.includes(h.courseId) && !homeworkSubmissions.some(s => s.homeworkId === h.id && s.studentId === user.id))
      .map(h => ({ id: h.id, kind: 'assignment' as const, title: h.title, course: h.courseName, due: new Date(h.dueDate) })),
    ...exams.filter(e => user.courses.includes(e.courseId) && e.isPublished && e.questions.length && new Date(e.scheduledDate).getTime() - 600000 <= now.getTime() && !examAttempts.some(a => a.examId === e.id && a.studentId === user.id && a.isSubmitted))
      .map(e => ({ id: e.id, kind: 'exam' as const, title: e.title, course: e.courseName, due: new Date(e.scheduledDate) })),
  ].sort((a, b) => a.due.getTime() - b.due.getTime());

  const news = announcements.filter(a => a.audience === 'all' || a.audience === 'students' || (a.audience === 'course' && a.courseId && user.courses.includes(a.courseId))).slice(0, 3);

  const alerts: React.ReactNode[] = [];
  if (fin.registration?.status === 'rejected') alerts.push(
    <div key="reg-rej" className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
      <p className="flex-1 min-w-[200px] text-sm text-red-900"><strong>Registration payment not confirmed.</strong> {fin.registration.rejectionReason ?? 'Finance could not match your reference.'}</p>
      <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={onResubmitRegistration}>Resubmit payment</Button>
    </div>);
  else if (fin.registration?.status === 'pending') alerts.push(
    <div key="reg-pend" className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <Hourglass className="w-5 h-5 text-amber-700 shrink-0" />
      <p className="text-sm text-amber-900"><strong>Registration fee received, waiting for Finance.</strong> Your student number is issued once it's confirmed.</p>
    </div>);
  if (!registered) alerts.push(
    <div key="reg-form" className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <FileCheck2 className="w-5 h-5 text-emerald-700 shrink-0" />
      <p className="flex-1 min-w-[200px] text-sm text-emerald-900"><strong>Complete your registration form</strong> to enrol in courses. It takes about 10 minutes and saves as you go.</p>
      <Button size="sm" onClick={onRegister}>Continue registration</Button>
    </div>);
  fin.overdue.slice(0, 1).forEach(i => {
    const c = courses.find(x => x.id === i.courseId);
    alerts.push(
      <div key={`od-${i.courseId}`} className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
        <p className="flex-1 min-w-[200px] text-sm text-red-900"><strong>{kwacha(i.amount)} overdue</strong> for {c?.name} (due {fmtDate(i.due)}).</p>
        <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => onPay(i.courseId, i.amount)}>Pay now</Button>
      </div>);
  });

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-stone-900 text-white p-6 sm:p-8">
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
        <motion.div aria-hidden animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.4, 0.25] }} transition={{ duration: 9, repeat: Infinity }} className="absolute -right-16 -top-20 w-72 h-72 rounded-full bg-amber-400/30 blur-3xl" />
        <div className="relative grid md:grid-cols-[1fr_minmax(0,320px)] gap-6 items-center">
          <div>
            <p className="text-emerald-200 text-sm">{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold">{greeting()}, {user.name.split(' ')[0]}</h2>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15">{user.studentNumber ? `Student no. ${user.studentNumber}` : 'Student number pending'}</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15">{mine.length} course{mine.length === 1 ? '' : 's'}</span>
              {todo.length > 0 && <span className="px-2.5 py-1 rounded-full bg-amber-400/90 text-amber-950 font-semibold">{todo.length} to do</span>}
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">Next up</p>
            {liveNow ? (
              <div className="mt-2">
                <p className="flex items-center gap-2 font-semibold"><span className="relative flex w-2.5 h-2.5"><span className="absolute inset-0 rounded-full bg-red-400 animate-ping" /><span className="relative w-2.5 h-2.5 rounded-full bg-red-500" /></span>Live now</p>
                <p className="text-sm text-emerald-50 mt-0.5">{liveNow.courseName}</p>
                <Button size="sm" className="mt-3 bg-white text-emerald-900 hover:bg-emerald-50 w-full" onClick={() => onJoin(liveNow.id)}><Video className="w-4 h-4" />Join class</Button>
              </div>
            ) : nextScheduled ? (
              <div className="mt-2">
                <p className="font-semibold">{nextScheduled.title}</p>
                <p className="text-sm text-emerald-100">{fmtDate(nextScheduled.when, true)} · {nextScheduled.where}</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-300"><CalendarClock className="w-4 h-4" />{countdown(nextScheduled.when)}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-emerald-100">{mine.length ? 'No classes scheduled yet.' : 'Enrol in a course to see your classes here.'}</p>
            )}
          </div>
        </div>
      </motion.section>

      {alerts.length > 0 && <div className="space-y-3">{alerts}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        {/* To do */}
        <section className="bg-white rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="font-bold text-stone-900">To do</h3>
            {todo.length > 0 && <button onClick={() => go('assignment')} className="text-sm font-medium text-emerald-700 hover:underline">All assignments</button>}
          </div>
          {todo.length === 0 ? (
            <div className="px-5 pb-8 pt-4 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
              <p className="font-semibold text-stone-900">Nothing due right now</p>
              <p className="text-sm text-stone-500">New assignments and exams will show up here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {todo.slice(0, 6).map((t, i) => {
                const overdue = t.kind === 'assignment' && t.due < now;
                const soon = !overdue && t.due.getTime() - now.getTime() < 3 * 86400000;
                return (
                  <motion.li key={t.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                    <button onClick={() => go(t.kind === 'exam' ? 'exams' : 'assignment')} className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-stone-50 group">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.kind === 'exam' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {t.kind === 'exam' ? <ClipboardCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold text-stone-900 truncate">{t.title}</span>
                        <span className="block text-xs text-stone-500 truncate">{t.course}</span>
                      </span>
                      {t.kind === 'exam' ? <StatusPill tone="amber">Open now</StatusPill>
                        : overdue ? <StatusPill tone="red">Overdue</StatusPill>
                        : <StatusPill tone={soon ? 'amber' : 'stone'}>Due {countdown(t.due)}</StatusPill>}
                      <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-emerald-700 transition" />
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Progress */}
        <section className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-stone-900">Course progress</h3>
            <button onClick={() => go('results')} className="text-sm font-medium text-emerald-700 hover:underline">Results</button>
          </div>
          {mine.length === 0 ? (
            <div className="text-center py-6">
              <Sparkles className="w-8 h-8 mx-auto text-amber-500 mb-2" />
              <p className="text-sm text-stone-600">You're not enrolled in any course yet.</p>
              <Button size="sm" className="mt-3" onClick={() => go('courses')}>Browse courses</Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {mine.map(c => {
                const p = courseProgress(c.id, user.id, homeworks, homeworkSubmissions, exams, examAttempts);
                return (
                  <li key={c.id}>
                    <button onClick={() => openCourse(c)} className="w-full flex items-center gap-3 text-left p-2 -m-2 rounded-xl hover:bg-stone-50">
                      <ProgressRing pct={p.pct} size={52} stroke={6} />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-stone-900 leading-snug line-clamp-2">{c.name}</span>
                        <span className="block text-xs text-stone-500">{p.total ? `${p.done} of ${p.total} tasks done` : 'No tasks set yet'}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {fin.next && (
            <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
              <div className="text-sm">
                <p className="text-stone-500">Next payment</p>
                <p className="font-semibold text-stone-900 tabular-nums">{kwacha(fin.next.amount)} · {fmtDate(fin.next.due)}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => go('finance')}>Payments</Button>
            </div>
          )}
        </section>
      </div>

      {news.length > 0 && (
        <section className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <h3 className="font-bold text-stone-900 mb-3 flex items-center gap-2"><Megaphone className="w-4 h-4 text-amber-600" />Announcements</h3>
          <ul className="space-y-3">
            {news.map(a => (
              <li key={a.id} className="flex gap-3">
                <span className={`w-1 rounded-full shrink-0 ${a.type === 'urgent' ? 'bg-red-500' : a.type === 'academic' ? 'bg-emerald-600' : 'bg-stone-300'}`} />
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900">{a.title}</p>
                  <p className="text-sm text-stone-600">{a.content}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{a.authorName} · {timeAgo(a.date)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
