import React, { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Download, GraduationCap } from 'lucide-react';
import { EmptyState, Segmented, StatusPill } from '../shell/ui';
import { courseMark, examMax, letter, letterTone, percent } from '@/app/lib/academics';

/** Every student's marks for one course, with an overall mark and grade. */
export const Gradebook: React.FC<{ onMark: () => void }> = ({ onMark }) => {
  const { user, users, courses, homeworks, homeworkSubmissions, exams, examAttempts, attendance, liveClasses } = useAuth();
  const mine = courses.filter(c => c.lecturerId === user?.id);
  const [courseId, setCourseId] = useState(mine[0]?.id ?? '');
  if (!user) return null;
  if (!mine.length) return <EmptyState icon={GraduationCap} title="No courses assigned yet" text="When administration assigns you a course, its gradebook appears here." />;

  const course = mine.find(c => c.id === courseId) ?? mine[0];
  const students = users.filter(u => u.role === 'student' && u.courses.includes(course.id)).sort((a, b) => a.name.localeCompare(b.name));
  const hw = homeworks.filter(h => h.courseId === course.id).sort((a, b) => a.assignedDate.localeCompare(b.assignedDate));
  const ex = exams.filter(e => e.courseId === course.id).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  const classes = liveClasses.filter(l => l.courseId === course.id && (l.isLive || new Date(l.scheduledTime) <= new Date()));

  const cell = (sid: string, kind: 'hw' | 'ex', id: string): { text: string; tone?: 'amber' | 'stone' } => {
    if (kind === 'hw') {
      const s = homeworkSubmissions.find(x => x.homeworkId === id && x.studentId === sid);
      if (!s) return { text: '—', tone: 'stone' };
      return s.grade === undefined ? { text: 'To mark', tone: 'amber' } : { text: `${s.grade}%` };
    }
    const a = examAttempts.find(x => x.examId === id && x.studentId === sid && x.isSubmitted);
    if (!a) return { text: '—', tone: 'stone' };
    const e = ex.find(x => x.id === id)!;
    return a.needsMarking ? { text: 'To mark', tone: 'amber' } : { text: `${percent(a.score ?? 0, examMax(e))}%` };
  };

  const attendanceRate = (sid: string) => classes.length ? Math.round((attendance.filter(a => a.studentId === sid && classes.some(c => c.id === a.liveClassId)).length / classes.length) * 100) : undefined;

  const exportCsv = () => {
    const head = ['Student', 'Student no.', ...hw.map(h => h.title), ...ex.map(e => e.title), 'Attendance %', 'Overall %', 'Grade'];
    const rows = students.map(s => {
      const o = courseMark(course.id, s.id, homeworks, homeworkSubmissions, exams, examAttempts);
      return [s.name, s.studentNumber ?? '', ...hw.map(h => cell(s.id, 'hw', h.id).text), ...ex.map(e => cell(s.id, 'ex', e.id).text), attendanceRate(s.id) ?? '', o ?? '', o !== undefined ? letter(o) : ''];
    });
    const csv = [head, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `${course.name} gradebook.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented id="gb-course" value={course.id} onChange={setCourseId} options={mine.map(c => [c.id, c.name.length > 28 ? `${c.name.slice(0, 26)}…` : c.name] as [string, string])} />
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!students.length}><Download className="w-4 h-4" />Export to Excel (CSV)</Button>
      </div>
      {students.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No students enrolled yet" text="Students appear here as soon as they enrol in this course." />
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-stone-50 text-stone-600">
              <tr>
                <th scope="col" className="text-left font-semibold px-4 py-3 sticky left-0 bg-stone-50">Student</th>
                {hw.map(h => <th key={h.id} scope="col" className="text-left font-semibold px-3 py-3 whitespace-nowrap" title={h.title}><span className="block text-[10px] uppercase text-stone-400">Assignment</span>{h.title.length > 18 ? `${h.title.slice(0, 16)}…` : h.title}</th>)}
                {ex.map(e => <th key={e.id} scope="col" className="text-left font-semibold px-3 py-3 whitespace-nowrap" title={e.title}><span className="block text-[10px] uppercase text-stone-400">Exam</span>{e.title.length > 18 ? `${e.title.slice(0, 16)}…` : e.title}</th>)}
                <th scope="col" className="text-left font-semibold px-3 py-3">Attendance</th>
                <th scope="col" className="text-left font-semibold px-3 py-3">Overall</th>
                <th scope="col" className="text-left font-semibold px-4 py-3">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 tabular-nums">
              {students.map(s => {
                const o = courseMark(course.id, s.id, homeworks, homeworkSubmissions, exams, examAttempts);
                const att = attendanceRate(s.id);
                return (
                  <tr key={s.id} className="hover:bg-stone-50/60">
                    <td className="px-4 py-3 sticky left-0 bg-white"><p className="font-medium text-stone-900 whitespace-nowrap">{s.name}</p><p className="text-xs text-stone-400">{s.studentNumber ?? 'No number yet'}</p></td>
                    {hw.map(h => { const c = cell(s.id, 'hw', h.id); return <td key={h.id} className="px-3 py-3">{c.tone === 'amber' ? <button onClick={onMark}><StatusPill tone="amber">To mark</StatusPill></button> : <span className={c.tone === 'stone' ? 'text-stone-300' : ''}>{c.text}</span>}</td>; })}
                    {ex.map(e => { const c = cell(s.id, 'ex', e.id); return <td key={e.id} className="px-3 py-3">{c.tone === 'amber' ? <button onClick={onMark}><StatusPill tone="amber">To mark</StatusPill></button> : <span className={c.tone === 'stone' ? 'text-stone-300' : ''}>{c.text}</span>}</td>; })}
                    <td className="px-3 py-3">{att !== undefined ? <span className={att < 75 ? 'text-red-600 font-semibold' : ''}>{att}%</span> : <span className="text-stone-300">—</span>}</td>
                    <td className="px-3 py-3 font-semibold">{o !== undefined ? `${o}%` : <span className="text-stone-300">—</span>}</td>
                    <td className="px-4 py-3">{o !== undefined ? <span className={`font-bold ${letterTone(o)}`}>{letter(o)}</span> : <span className="text-stone-300">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-stone-500">Overall is the average of each marked assignment and exam. Attendance below 75% is shown in red.</p>
    </div>
  );
};
