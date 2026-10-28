import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '@/app/context/AuthContext';
import { ChevronDown, UserCheck, Check } from 'lucide-react';
import { EmptyState, StatusPill, fmtDate } from '../shell/ui';

/** Who attended each live class. Joining from the student portal marks them present; lecturers can tick people off by hand. */
export const Attendance: React.FC = () => {
  const { user, users, liveClasses, attendance, recordAttendance, removeAttendance } = useAuth();
  const [open, setOpen] = useState<string | null>(null);
  if (!user) return null;
  const now = new Date();
  const classes = liveClasses.filter(l => l.lecturerId === user.id && (l.isLive || new Date(l.scheduledTime) <= now)).sort((a, b) => b.scheduledTime.localeCompare(a.scheduledTime));

  if (!classes.length) return <EmptyState icon={UserCheck} title="No classes held yet" text="After you run a live class, attendance shows here. Students who join are marked present automatically." />;

  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-500">Students who join from their portal are marked present automatically. Tick names to correct the register.</p>
      {classes.map(l => {
        const enrolled = users.filter(u => u.role === 'student' && u.courses.includes(l.courseId)).sort((a, b) => a.name.localeCompare(b.name));
        const present = attendance.filter(a => a.liveClassId === l.id);
        const pct = enrolled.length ? Math.round((present.length / enrolled.length) * 100) : 0;
        const isOpen = open === l.id;
        return (
          <div key={l.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <button onClick={() => setOpen(isOpen ? null : l.id)} aria-expanded={isOpen} className="w-full flex flex-wrap items-center gap-4 px-5 py-4 text-left hover:bg-stone-50">
              <div className="flex-1 min-w-[180px]">
                <p className="font-semibold text-stone-900">{l.courseName}</p>
                <p className="text-xs text-stone-500">{fmtDate(l.scheduledTime, true)}</p>
              </div>
              {l.isLive && <StatusPill tone="red">Live now</StatusPill>}
              <div className="w-40">
                <div className="flex justify-between text-xs text-stone-500 mb-1 tabular-nums"><span>{present.length}/{enrolled.length} present</span><span>{pct}%</span></div>
                <div className="h-2 rounded-full bg-stone-100 overflow-hidden"><div className={`h-full rounded-full ${pct >= 75 ? 'bg-emerald-600' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} /></div>
              </div>
              <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-stone-100">
                  <ul className="grid sm:grid-cols-2 gap-2 p-4">
                    {enrolled.length === 0 && <li className="text-sm text-stone-500">No students enrolled.</li>}
                    {enrolled.map(s => {
                      const rec = present.find(p => p.studentId === s.id);
                      return (
                        <li key={s.id}>
                          <button onClick={() => (rec ? removeAttendance(l.id, s.id) : recordAttendance(l.id, s.id, 'lecturer'))} aria-pressed={!!rec}
                            className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${rec ? 'border-emerald-300 bg-emerald-50' : 'border-stone-200 hover:border-stone-300'}`}>
                            <span className={`w-5 h-5 rounded-md keep-border border-2 flex items-center justify-center ${rec ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300'}`}>{rec && <Check className="w-3.5 h-3.5" />}</span>
                            <span className="flex-1 font-medium text-stone-900">{s.name}</span>
                            {rec && <span className="text-xs text-stone-500">{rec.markedBy === 'auto' ? 'joined' : 'marked'}</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
