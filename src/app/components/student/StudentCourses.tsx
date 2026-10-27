import { LEVELS, levelLabel, type Level } from '@/app/lib/levels';
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth, type Course } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { BookOpen, Search, ArrowRight, User, Lock } from 'lucide-react';
import { SectionTitle, Segmented, EmptyState, StatusPill } from '../shell/ui';
import { courseProgress } from '@/app/lib/academics';

const gradientFor = (l?: string) => (l === 'teveta_level_3' ? 'from-navy to-ink' : l === 'advanced' || l === 'refresher' ? 'from-stone-700 to-ink' : l === 'office' ? 'from-royal to-royal-deep' : 'from-emerald-600 to-teal-700');

interface Props { openCourse: (c: Course) => void; onEnrol: (c: Course) => void; canEnrol: boolean }

export const StudentCourses: React.FC<Props> = ({ openCourse, onEnrol, canEnrol }) => {
  const { user, courses, homeworks, homeworkSubmissions, exams, examAttempts } = useAuth();
  const [level, setLevel] = useState<'all' | Level>('all');
  const [q, setQ] = useState('');
  if (!user) return null;

  const mine = courses.filter(c => user.courses.includes(c.id));
  const catalogue = courses
    .filter(c => !user.courses.includes(c.id))
    .filter(c => level === 'all' || (c.level ?? 'beginner') === level)
    .filter(c => `${c.name} ${c.description} ${c.lecturerName}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-10">
      <section>
        <SectionTitle title="My courses" sub={mine.length ? 'Open a course to see its recordings and assignments.' : undefined} />
        {mine.length === 0 ? (
          <EmptyState icon={BookOpen} title="You're not enrolled yet" text="Choose a course below. You can pay in full or in monthly instalments." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {mine.map((c, i) => {
              const p = courseProgress(c.id, user.id, homeworks, homeworkSubmissions, exams, examAttempts);
              const enr = user.enrollments?.find(e => e.courseId === c.id);
              return (
                <motion.button key={c.id} onClick={() => openCourse(c)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -3 }}
                  className="group text-left bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-[box-shadow,border-color] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <StatusPill tone="emerald">{levelLabel(c.level)}</StatusPill>
                    {enr && <span className="text-xs text-stone-500 capitalize">{enr.type.replace('-', ' ')}</span>}
                  </div>
                  <h3 className="mt-3 font-bold text-stone-900 text-lg leading-snug">{c.name}</h3>
                  <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{c.lecturerName}</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-stone-500 mb-1.5"><span>{p.total ? `${p.done} of ${p.total} tasks` : 'No tasks yet'}</span><span className="font-semibold text-stone-700">{p.pct}%</span></div>
                    <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                      <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500" initial={{ width: 0 }} animate={{ width: `${p.pct}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
                    </div>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-emerald-700 inline-flex items-center gap-1">Open course <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></p>
                </motion.button>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionTitle title="Browse courses" sub="Prices are in Zambian Kwacha. Pay in full or in 3 or 6 monthly instalments." />
        {!canEnrol && (
          <div className="mb-4 flex items-center gap-2 text-sm rounded-xl bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3">
            <Lock className="w-4 h-4 shrink-0" />{user.studentNumber ? 'Complete your registration form to enrol. You can still look around.' : 'You can enrol once Finance confirms your registration fee and issues your student number. You can still look around.'}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <Segmented id="level" value={level} onChange={setLevel} options={[['all', 'All'], ...LEVELS.filter(lv => courses.some(c => (c.level ?? 'beginner') === lv.id)).map(lv => [lv.id, lv.label] as ['all' | Level, string])]} />
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input id="course-search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search courses" className="pl-9 bg-white" />
          </div>
        </div>
        {catalogue.length === 0 ? (
          <EmptyState icon={Search} title={courses.length === mine.length ? "You've enrolled in every course" : 'No courses match'} text={courses.length === mine.length ? 'New courses will appear here when they open.' : 'Try another level or search word.'} />
        ) : (
          <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {catalogue.map(c => (
                <motion.article key={c.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                  className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-emerald-300 transition-[box-shadow,border-color] flex flex-col">
                  <div className={`h-20 bg-gradient-to-br ${gradientFor(c.level)} relative`}>
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                    <span className="absolute left-4 top-4 bg-white/90 text-stone-900 text-xs font-semibold px-2.5 py-0.5 rounded-full">{levelLabel(c.level)}</span>
                    <BookOpen className="absolute right-4 bottom-3 w-9 h-9 text-white/25 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-stone-900 leading-snug">{c.name}</h3>
                    <p className="text-xs text-stone-500 mt-1">{c.lecturerName} · {c.credits} credits</p>
                    <p className="text-sm text-stone-600 mt-2 line-clamp-3 flex-1">{c.description}</p>
                    <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-stone-900 tabular-nums">K {c.price.toLocaleString()}</p>
                        <p className="text-xs text-stone-500 tabular-nums">or K {Math.round(c.price / 3).toLocaleString()} × 3</p>
                      </div>
                      <Button size="sm" onClick={() => onEnrol(c)} variant={canEnrol ? 'default' : 'outline'}>{canEnrol ? 'Enrol' : <><Lock className="w-3.5 h-3.5" />Enrol</>}</Button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>
    </div>
  );
};
