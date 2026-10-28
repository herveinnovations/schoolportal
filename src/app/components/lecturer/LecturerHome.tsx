import React from 'react';
import { motion } from 'motion/react';
import { useSite } from '@/app/context/SiteContext';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Video, FileText, ClipboardCheck, PlayCircle, PenLine, MapPin, CalendarClock, ArrowRight, Users, CheckCircle2 } from 'lucide-react';
import { DAYS, StatusPill, countdown, fmtDate, greeting, nextOccurrence, ProgressRing } from '../shell/ui';
import { timeAgo } from '../shell/NotificationBell';
import { courseMark } from '@/app/lib/academics';

interface Props {
  go: (tab: string) => void;
  quick: (what: 'live' | 'assignment' | 'exam' | 'recording') => void;
  onStart: (liveClassId: string) => void;
}

export const LecturerHome: React.FC<Props> = ({ go, quick, onStart }) => {
  const { user, users, courses, timetable, liveClasses, homeworks, homeworkSubmissions, exams, examAttempts } = useAuth();
  const { images: siteImages } = useSite();
  if (!user) return null;
  const now = new Date();
  const today = DAYS[now.getDay()];
  const myCourses = courses.filter(c => c.lecturerId === user.id);
  const myIds = new Set(myCourses.map(c => c.id));
  const students = users.filter(u => u.role === 'student' && u.courses.some(c => myIds.has(c)));

  const todaySlots = timetable.filter(t => t.lecturerId === user.id && t.day === today).sort((a, b) => a.time.localeCompare(b.time));
  const myLive = liveClasses.filter(l => l.lecturerId === user.id);
  const liveNow = myLive.filter(l => l.isLive);
  const todayLive = myLive.filter(l => !l.isLive && new Date(l.scheduledTime).toDateString() === now.toDateString());
  const nextLive = myLive.filter(l => !l.isLive && new Date(l.scheduledTime) > now).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))[0];
  const nextSlot = timetable.filter(t => t.lecturerId === user.id).map(t => ({ t, when: nextOccurrence(t.day, t.time, now)! })).sort((a, b) => a.when.getTime() - b.when.getTime())[0];

  const myHw = homeworks.filter(h => h.lecturerId === user.id);
  const myEx = exams.filter(e => e.lecturerId === user.id);
  const subsToMark = homeworkSubmissions.filter(s => myHw.some(h => h.id === s.homeworkId) && s.grade === undefined);
  const scriptsToMark = examAttempts.filter(a => a.needsMarking && myEx.some(e => e.id === a.examId));
  const recent = homeworkSubmissions.filter(s => myHw.some(h => h.id === s.homeworkId)).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 5);

  const actions = [
    { id: 'live' as const, label: 'Schedule a live class', icon: Video, tone: 'bg-red-100 text-red-700' },
    { id: 'assignment' as const, label: 'Post an assignment', icon: FileText, tone: 'bg-emerald-100 text-emerald-800' },
    { id: 'exam' as const, label: 'Build an exam', icon: ClipboardCheck, tone: 'bg-amber-100 text-amber-800' },
    { id: 'recording' as const, label: 'Add a recording', icon: PlayCircle, tone: 'bg-stone-100 text-stone-700' },
  ];

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden bg-ink text-white p-6 sm:p-10">
        <img src={siteImages.hero} alt="" aria-hidden onError={e => { e.currentTarget.style.display = 'none'; }} className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sun text-sm font-semibold tracking-wide">{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h2 className="mt-2 font-display font-extrabold text-[30px] sm:text-[40px] leading-[1.1] tracking-[-0.01em]">{greeting()}, {user.name.replace(/^(Mr|Ms|Mrs|Dr)\.?\s/, '').split(' ')[0]}</h2>
            <p className="mt-2 text-sm text-stone-200">{myCourses.length} course{myCourses.length === 1 ? '' : 's'} · {students.length} student{students.length === 1 ? '' : 's'}</p>
          </div>
          {(subsToMark.length + scriptsToMark.length) > 0 ? (
            <button onClick={() => go('marking')} className="group rounded-2xl bg-white/10 border border-white/15 px-5 py-4 text-left hover:bg-white/15 transition">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">Waiting for you</p>
              <p className="text-3xl font-bold tabular-nums">{subsToMark.length + scriptsToMark.length}</p>
              <p className="text-sm text-stone-200 inline-flex items-center gap-1">to mark <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></p>
            </button>
          ) : (
            <p className="rounded-2xl bg-white/10 border border-white/15 px-5 py-4 text-sm inline-flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-300" />Marking is up to date</p>
          )}
        </div>
      </motion.section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((a, i) => (
          <motion.button key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }} whileHover={{ y: -3 }} onClick={() => quick(a.id)}
            className="flex items-center gap-3 bg-white rounded-2xl border border-stone-200 p-4 text-left shadow-sm hover:shadow-md hover:border-emerald-300 transition-[box-shadow,border-color]">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.tone}`}><a.icon className="w-5 h-5" /></span>
            <span className="text-sm font-semibold text-stone-900 leading-snug">{a.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <h3 className="font-bold text-stone-900 mb-3">Today</h3>
          {liveNow.map(l => (
            <div key={l.id} className="mb-3 flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 p-3">
              <span className="relative flex w-2.5 h-2.5"><span className="absolute inset-0 rounded-full bg-red-400 animate-ping" /><span className="relative w-2.5 h-2.5 rounded-full bg-red-500" /></span>
              <p className="flex-1 min-w-0 truncate text-sm"><strong>Live now:</strong> {l.courseName}</p>
              <Button size="sm" onClick={() => onStart(l.id)}>Open</Button>
            </div>
          ))}
          {todaySlots.length === 0 && todayLive.length === 0 && liveNow.length === 0 ? (
            <div className="text-sm text-stone-500 py-4">
              No classes today.
              {(nextLive || nextSlot) && <p className="mt-1 flex items-center gap-1.5 text-stone-700"><CalendarClock className="w-4 h-4 text-emerald-700" />Next: {nextLive ? `${nextLive.courseName}, ${countdown(new Date(nextLive.scheduledTime))}` : `${nextSlot!.t.courseName}, ${fmtDate(nextSlot!.when, true)}`}</p>}
            </div>
          ) : (
            <ul className="space-y-2">
              {todaySlots.map(t => (
                <li key={t.id} className="flex items-center gap-3 rounded-xl border border-stone-200 p-3">
                  <span className="text-sm font-semibold text-emerald-800 tabular-nums w-24 shrink-0">{t.time}</span>
                  <span className="flex-1 min-w-0"><span className="block text-sm font-medium text-stone-900 truncate">{t.courseName}</span><span className="block text-xs text-stone-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{t.room}</span></span>
                </li>
              ))}
              {todayLive.map(l => (
                <li key={l.id} className="flex items-center gap-3 rounded-xl border border-stone-200 p-3">
                  <span className="text-sm font-semibold text-red-700 tabular-nums w-24 shrink-0">{new Date(l.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="flex-1 text-sm font-medium text-stone-900 truncate">Live: {l.courseName}</span>
                  <Button size="sm" variant="outline" onClick={() => onStart(l.id)}>Go live</Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-stone-900">Recent submissions</h3>
            <button onClick={() => go('marking')} className="text-sm font-medium text-emerald-700 hover:underline">Marking</button>
          </div>
          {recent.length === 0 ? <p className="text-sm text-stone-500 py-4">No submissions yet.</p> : (
            <ul className="divide-y divide-stone-100">
              {recent.map(s => {
                const h = myHw.find(x => x.id === s.homeworkId)!;
                return (
                  <li key={s.id} className="flex items-center gap-3 py-2.5">
                    <PenLine className="w-4 h-4 text-stone-400 shrink-0" />
                    <span className="flex-1 min-w-0"><span className="block text-sm font-medium text-stone-900 truncate">{s.studentName}</span><span className="block text-xs text-stone-500 truncate">{h.title} · {timeAgo(s.submittedAt)}</span></span>
                    {s.grade === undefined ? <StatusPill tone="amber">To mark</StatusPill> : <StatusPill tone="green">{s.grade}%</StatusPill>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section>
        <h3 className="font-bold text-stone-900 mb-3">My courses</h3>
        {myCourses.length === 0 ? <p className="text-sm text-stone-500">Administration hasn't assigned you a course yet.</p> : (
          <div className="grid sm:grid-cols-2 gap-4">
            {myCourses.map(c => {
              const enrolled = users.filter(u => u.role === 'student' && u.courses.includes(c.id));
              const marks = enrolled.map(s => courseMark(c.id, s.id, homeworks, homeworkSubmissions, exams, examAttempts)).filter((m): m is number => m !== undefined);
              const avg = marks.length ? Math.round(marks.reduce((a, b) => a + b, 0) / marks.length) : undefined;
              return (
                <button key={c.id} onClick={() => go('gradebook')} className="group flex items-center gap-4 bg-white rounded-2xl border border-stone-200 p-5 text-left shadow-sm hover:shadow-md hover:border-emerald-300 transition">
                  <ProgressRing pct={avg ?? 0} label={avg !== undefined ? `${avg}%` : '—'} />
                  <span className="min-w-0">
                    <span className="block font-semibold text-stone-900 leading-snug">{c.name}</span>
                    <span className="block text-xs text-stone-500 mt-1 flex items-center gap-1"><Users className="w-3.5 h-3.5" />{enrolled.length} students · class average</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
