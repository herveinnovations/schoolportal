import React from 'react';
import { motion } from 'motion/react';
import { useSite } from '@/app/context/SiteContext';
import { toast } from 'sonner';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth, staffCan } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Wallet, Users, BookOpen, AlertTriangle, ArrowRight, Database, CheckCircle2, PenLine, UserPlus, Clock } from 'lucide-react';
import { Stat, greeting } from '../shell/ui';
import { timeAgo } from '../shell/NotificationBell';
import { kwacha, studentFinance } from '@/app/lib/finance';

const tooltipStyle = { borderRadius: 0, border: '1px solid #e7e5e4', boxShadow: '0 8px 24px rgba(0,0,0,.08)', fontSize: 12 };

export const StaffOverview: React.FC<{ go: (tab: string) => void }> = ({ go }) => {
  const { user, users, courses, paymentClaims, homeworkSubmissions, examAttempts, activityLogs } = useAuth();
  const { images: siteImages } = useSite();
  if (!user) return null;
  const now = new Date();
  const students = users.filter(u => u.role === 'student');
  const lecturers = users.filter(u => u.role === 'lecturer');
  const pending = paymentClaims.filter(c => c.status === 'pending');
  const finances = students.map(s => ({ s, f: studentFinance(s, paymentClaims) }));
  const overdueStudents = finances.filter(x => x.f.overdue.length > 0);
  const outstanding = finances.reduce((sum, x) => sum + x.f.balance, 0);
  const awaitingRegistration = students.filter(s => !s.studentNumber);
  const unmarked = homeworkSubmissions.filter(s => s.grade === undefined).length + examAttempts.filter(a => a.needsMarking).length;

  const txs = students.flatMap(s => (s.transactions ?? []).filter(t => t.status === 'completed'));
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1); return d; });
  const revenue = months.map(m => ({
    month: m.toLocaleDateString(undefined, { month: 'short' }),
    amount: txs.filter(t => { const d = new Date(t.date); return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth(); }).reduce((s, t) => s + t.amount, 0),
  }));
  const last30 = txs.filter(t => now.getTime() - new Date(t.date).getTime() <= 30 * 86400000).reduce((sum, t) => sum + t.amount, 0);
  const byCourse = courses.map(c => ({ name: c.name.length > 24 ? `${c.name.slice(0, 22).trim()}…` : c.name, full: c.name, students: students.filter(s => s.courses.includes(c.id)).length }))
    .sort((a, b) => b.students - a.students);

  const attention = [
    pending.length > 0 && { icon: Wallet, tone: 'bg-amber-100 text-amber-800', text: `${pending.length} payment${pending.length === 1 ? '' : 's'} waiting to be confirmed`, sub: `${kwacha(pending.reduce((s, c) => s + c.amount, 0))} in total`, tab: 'payments' },
    overdueStudents.length > 0 && { icon: AlertTriangle, tone: 'bg-red-100 text-red-700', text: `${overdueStudents.length} student${overdueStudents.length === 1 ? ' has' : 's have'} an overdue instalment`, sub: 'More than a week past the due date', tab: 'students' },
    awaitingRegistration.length > 0 && { icon: UserPlus, tone: 'bg-stone-100 text-stone-700', text: `${awaitingRegistration.length} student${awaitingRegistration.length === 1 ? '' : 's'} without a student number`, sub: 'Admission form fee not yet confirmed', tab: 'students' },
    unmarked > 0 && staffCan(user, 'academics') && { icon: PenLine, tone: 'bg-emerald-100 text-emerald-800', text: `${unmarked} piece${unmarked === 1 ? '' : 's'} of work waiting for lecturers to mark`, sub: 'Assignments and exam essays', tab: 'results' },
  ].filter(Boolean) as { icon: typeof Wallet; tone: string; text: string; sub: string; tab: string }[];

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden bg-ink text-white p-6 sm:p-10">
        <img src={siteImages.hero} alt="" aria-hidden onError={e => { e.currentTarget.style.display = 'none'; }} className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sun text-sm font-semibold tracking-wide">{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h2 className="mt-2 font-display font-extrabold text-[30px] sm:text-[40px] leading-[1.1] tracking-[-0.01em]">{greeting()}, {user.name.split(' ')[0]}</h2>
            <p className="mt-2 text-sm text-stone-200">{attention.length ? `${attention.length} thing${attention.length === 1 ? '' : 's'} need${attention.length === 1 ? 's' : ''} attention today.` : 'Everything is up to date.'}</p>
          </div>
          {user.staffRole && <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">{user.staffRole === 'admin' ? 'Administrator' : user.staffRole === 'finance' ? 'Finance' : 'Registrar'}</span>}
        </div>
      </motion.section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Students" value={students.length} hint={`${lecturers.length} lecturer${lecturers.length === 1 ? '' : 's'}`} icon={Users} onClick={() => go('students')} />
        <Stat label="Received, last 30 days" value={kwacha(last30)} tone="text-emerald-700" icon={Wallet} onClick={() => go('payments')} />
        <Stat label="Waiting to confirm" value={kwacha(pending.reduce((s, c) => s + c.amount, 0))} hint={`${pending.length} payment${pending.length === 1 ? '' : 's'}`} tone={pending.length ? 'text-amber-700' : 'text-stone-900'} icon={Clock} onClick={() => go('payments')} />
        <Stat label="Fees outstanding" value={kwacha(outstanding)} hint={`${courses.length} courses`} icon={BookOpen} onClick={() => go('students')} />
      </div>

      <section className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
        <h3 className="font-bold text-stone-900 mb-3">Needs attention</h3>
        {attention.length === 0 ? (
          <p className="text-sm text-stone-600 flex items-center gap-2 py-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" />Nothing waiting. Payments, registrations and marking are all up to date.</p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-3">
            {attention.map((a, i) => (
              <motion.li key={a.text} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <button onClick={() => go(a.tab)} className="group w-full flex items-center gap-3 rounded-xl border border-stone-200 p-3 text-left hover:border-emerald-300 hover:bg-stone-50 transition">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.tone}`}><a.icon className="w-5 h-5" /></span>
                  <span className="flex-1 min-w-0"><span className="block text-sm font-semibold text-stone-900">{a.text}</span><span className="block text-xs text-stone-500">{a.sub}</span></span>
                  <ArrowRight className="w-4 h-4 text-stone-400 transition-transform group-hover:translate-x-1" />
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <h3 className="font-bold text-stone-900">Money received</h3>
          <p className="text-xs text-stone-500 mb-4">Confirmed payments, last 6 months (ZMW)</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f5f5f4" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#78716c' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a8a29e' }} tickFormatter={v => (v >= 1000 ? `${v / 1000}k` : v)} width={40} />
                <Tooltip cursor={{ fill: '#f5f5f4' }} contentStyle={tooltipStyle} formatter={(v: number) => [kwacha(v), 'Received']} />
                <Bar dataKey="amount" fill="#3a2f8f" radius={0} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <h3 className="font-bold text-stone-900">Students per course</h3>
          <p className="text-xs text-stone-500 mb-4">Current enrolments</p>
          {byCourse.length === 0 ? <p className="text-sm text-stone-500 py-10 text-center">No courses yet.</p> : (
            <div style={{ height: Math.max(160, byCourse.length * 44) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCourse} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke="#f5f5f4" />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a8a29e' }} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={170} interval={0} tick={{ fontSize: 12, fill: '#44403c', width: 170 } as never} />
                  <Tooltip cursor={{ fill: '#f5f5f4' }} contentStyle={tooltipStyle} labelFormatter={(_, p) => p?.[0]?.payload?.full ?? ''} formatter={(v: number) => [v, 'Students']} />
                  <Bar dataKey="students" fill="#fec131" radius={0} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <section className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
        <h3 className="font-bold text-stone-900 mb-3">Recent activity</h3>
        {activityLogs.length === 0 ? <p className="text-sm text-stone-500">No activity yet.</p> : (
          <ul className="divide-y divide-stone-100">
            {activityLogs.slice(0, 8).map(l => (
              <li key={l.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className={`w-2 h-2 rounded-full ${l.userRole === 'lecturer' ? 'bg-amber-500' : l.userRole === 'staff' ? 'bg-teal-600' : 'bg-emerald-600'}`} />
                <span className="flex-1 min-w-0 truncate"><strong className="font-semibold text-stone-900">{l.userName}</strong> <span className="text-stone-600">{l.action === 'login' ? 'signed in' : l.action === 'join_class' ? 'joined a class' : l.action === 'taught_class' ? 'taught a class' : 'left a class'}{l.details ? ` · ${l.details}` : ''}</span></span>
                <span className="text-xs text-stone-400 shrink-0">{timeAgo(l.timestamp)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
