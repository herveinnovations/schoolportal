import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useAuth, type HomeworkSubmission, type ExamAttempt } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { FileText, ClipboardCheck, CheckCircle2, XCircle, PenLine, ArrowRight } from 'lucide-react';
import { EmptyState, Segmented, StatusPill, fmtDate } from '../shell/ui';
import { timeAgo } from '../shell/NotificationBell';
import { examMax, isObjective, letter, percent } from '@/app/lib/academics';

const QUICK = ['Well done.', 'Good effort. Check the instructions again.', 'Show your working.', 'Please resubmit with corrections.'];

type Item =
  | { kind: 'assignment'; id: string; at: string; student: string; title: string; course: string; sub: HomeworkSubmission; due: string }
  | { kind: 'exam'; id: string; at: string; student: string; title: string; course: string; attempt: ExamAttempt };

export const Marking: React.FC = () => {
  const { user, homeworks, homeworkSubmissions, exams, examAttempts, gradeSubmission, markExamAttempt } = useAuth();
  const [view, setView] = useState<'todo' | 'done'>('todo');
  const [openId, setOpenId] = useState<string | null>(null);

  const myHw = useMemo(() => homeworks.filter(h => h.lecturerId === user?.id), [homeworks, user?.id]);
  const myEx = useMemo(() => exams.filter(e => e.lecturerId === user?.id), [exams, user?.id]);

  const all: Item[] = useMemo(() => [
    ...homeworkSubmissions.filter(s => myHw.some(h => h.id === s.homeworkId)).map(s => {
      const h = myHw.find(x => x.id === s.homeworkId)!;
      return { kind: 'assignment' as const, id: s.id, at: s.submittedAt, student: s.studentName, title: h.title, course: h.courseName, sub: s, due: h.dueDate };
    }),
    ...examAttempts.filter(a => a.isSubmitted && myEx.some(e => e.id === a.examId)).map(a => {
      const e = myEx.find(x => x.id === a.examId)!;
      return { kind: 'exam' as const, id: a.id, at: a.endTime ?? a.startTime, student: a.studentName, title: e.title, course: e.courseName, attempt: a };
    }),
  ], [homeworkSubmissions, examAttempts, myHw, myEx]);

  const todo = all.filter(i => (i.kind === 'assignment' ? i.sub.grade === undefined : !!i.attempt.needsMarking)).sort((a, b) => a.at.localeCompare(b.at));
  const done = all.filter(i => !todo.includes(i)).sort((a, b) => b.at.localeCompare(a.at));
  const list = view === 'todo' ? todo : done;
  const current = all.find(i => i.id === openId);

  const openNext = () => {
    const rest = todo.filter(i => i.id !== openId);
    setOpenId(rest[0]?.id ?? null);
  };

  if (!user) return null;

  return (
    <div className="space-y-5">
      <Segmented id="marking" value={view} onChange={setView} options={[['todo', `To mark (${todo.length})`], ['done', `Marked (${done.length})`]]} />

      {list.length === 0 ? (
        view === 'todo'
          ? <EmptyState icon={CheckCircle2} title="All caught up" text="New submissions and exam scripts with written answers appear here." />
          : <EmptyState icon={PenLine} title="Nothing marked yet" text="Work you mark shows here so you can review or change the grade." />
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm divide-y divide-stone-100">
          <AnimatePresence initial={false}>
            {list.map(i => {
              const late = i.kind === 'assignment' && new Date(i.at) > new Date(i.due);
              return (
                <motion.button key={i.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} onClick={() => setOpenId(i.id)}
                  className="w-full flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3.5 text-left hover:bg-stone-50 group">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${i.kind === 'exam' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {i.kind === 'exam' ? <ClipboardCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </span>
                  <span className="flex-1 min-w-[180px]">
                    <span className="block font-semibold text-stone-900">{i.student}</span>
                    <span className="block text-sm text-stone-500 truncate">{i.title} · {i.course}</span>
                  </span>
                  <span className="text-xs text-stone-400">{timeAgo(i.at)}</span>
                  {late && <StatusPill tone="red">Late</StatusPill>}
                  {view === 'done' && (i.kind === 'assignment'
                    ? <StatusPill tone="green">{i.sub.grade}%</StatusPill>
                    : <StatusPill tone="green">{i.attempt.score}/{examMax(exams.find(e => e.id === i.attempt.examId)!)}</StatusPill>)}
                  <span className="text-sm font-semibold text-emerald-700 inline-flex items-center gap-1">{view === 'todo' ? 'Mark' : 'Review'}<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" /></span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={!!current} onOpenChange={o => !o && setOpenId(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
          {current?.kind === 'assignment' && (
            <AssignmentMark key={current.id} item={current} remaining={todo.filter(i => i.id !== current.id).length}
              onSave={(g, fb, next) => {
                gradeSubmission(current.sub.id, g, fb);
                toast.success(`Marked: ${current.student} gets ${g}%`);
                next ? openNext() : setOpenId(null);
              }} />
          )}
          {current?.kind === 'exam' && (
            <ExamMark key={current.id} attempt={current.attempt} remaining={todo.filter(i => i.id !== current.id).length}
              onSave={(marks, fb, next) => {
                markExamAttempt(current.attempt.id, marks, fb);
                toast.success(`Exam marked for ${current.student}`);
                next ? openNext() : setOpenId(null);
              }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AssignmentMark: React.FC<{ item: Extract<Item, { kind: 'assignment' }>; remaining: number; onSave: (g: number, fb: string, next: boolean) => void }> = ({ item, remaining, onSave }) => {
  const [grade, setGrade] = useState(item.sub.grade?.toString() ?? '');
  const [fb, setFb] = useState(item.sub.feedback ?? '');
  const g = Math.max(0, Math.min(100, Number(grade)));
  const valid = grade !== '' && !Number.isNaN(Number(grade)) && Number(grade) >= 0 && Number(grade) <= 100;
  return (
    <div className="space-y-4">
      <DialogHeader className="text-left">
        <DialogTitle>{item.title}</DialogTitle>
        <DialogDescription>{item.student} · {item.course} · submitted {fmtDate(item.at, true)}</DialogDescription>
      </DialogHeader>
      <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 max-h-64 overflow-y-auto">
        <p className="text-sm whitespace-pre-wrap text-stone-800 font-mono">{item.sub.content}</p>
      </div>
      <div className="grid sm:grid-cols-[160px_1fr] gap-4 items-start">
        <div className="space-y-1.5">
          <Label htmlFor="grade">Mark (%)</Label>
          <Input id="grade" type="number" min={0} max={100} inputMode="numeric" value={grade} onChange={e => setGrade(e.target.value)} className="text-lg font-semibold" />
          {valid && <p className="text-xs text-stone-500">Grade {letter(g)}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fb">Feedback for the student</Label>
          <Textarea id="fb" rows={3} value={fb} onChange={e => setFb(e.target.value)} placeholder="What they did well and what to improve" />
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map(q => <button key={q} type="button" onClick={() => setFb(f => (f ? `${f} ${q}` : q))} className="text-xs px-2.5 py-1 rounded-full border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50">{q}</button>)}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-stone-100">
        <Button variant="outline" disabled={!valid} onClick={() => onSave(g, fb, false)}>Save</Button>
        {remaining > 0 && <Button disabled={!valid} onClick={() => onSave(g, fb, true)}>Save and mark next ({remaining})</Button>}
      </div>
    </div>
  );
};

const ExamMark: React.FC<{ attempt: ExamAttempt; remaining: number; onSave: (marks: Record<string, number>, fb: string, next: boolean) => void }> = ({ attempt, remaining, onSave }) => {
  const { exams } = useAuth();
  const exam = exams.find(e => e.id === attempt.examId)!;
  const [marks, setMarks] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = { ...(attempt.essayMarks ?? {}) };
    exam.questions.filter(q => !isObjective(q)).forEach(q => { if (m[q.id] === undefined) m[q.id] = 0; });
    return m;
  });
  const [fb, setFb] = useState(attempt.feedback ?? '');
  const max = examMax(exam);
  const total = (attempt.autoScore ?? 0) + Object.values(marks).reduce((s, v) => s + (Number(v) || 0), 0);

  return (
    <div className="space-y-4">
      <DialogHeader className="text-left">
        <DialogTitle>{exam.title}</DialogTitle>
        <DialogDescription>{attempt.studentName} · submitted {fmtDate(attempt.endTime ?? attempt.startTime, true)}</DialogDescription>
      </DialogHeader>
      <ol className="space-y-3">
        {exam.questions.map((q, i) => {
          const ans = attempt.answers[q.id];
          const obj = isObjective(q);
          const correct = obj && ans && ans.trim().toLowerCase() === q.correctAnswer!.trim().toLowerCase();
          return (
            <li key={q.id} className="rounded-xl border border-stone-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-stone-900"><span className="text-stone-400 mr-1">{i + 1}.</span>{q.question}</p>
                <span className="text-xs text-stone-500 shrink-0">{q.marks} mark{q.marks === 1 ? '' : 's'}</span>
              </div>
              <p className={`mt-2 text-sm rounded-lg px-3 py-2 whitespace-pre-wrap ${ans ? 'bg-stone-50 text-stone-800' : 'bg-stone-50 text-stone-400 italic'}`}>{ans || 'No answer'}</p>
              {obj ? (
                <p className={`mt-2 text-sm flex items-center gap-1.5 ${correct ? 'text-green-700' : 'text-red-600'}`}>
                  {correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {correct ? `Correct · ${q.marks}/${q.marks} (auto-marked)` : `Incorrect · answer: ${q.correctAnswer} · 0/${q.marks}`}
                </p>
              ) : (
                <div className="mt-3 flex items-center gap-2">
                  <Label htmlFor={`m-${q.id}`} className="text-sm">Marks</Label>
                  <Input id={`m-${q.id}`} type="number" min={0} max={q.marks} className="w-20" value={marks[q.id] ?? 0}
                    onChange={e => setMarks(m => ({ ...m, [q.id]: Math.max(0, Math.min(q.marks, Number(e.target.value) || 0)) }))} />
                  <span className="text-sm text-stone-500">/ {q.marks}</span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <div className="space-y-1.5">
        <Label htmlFor="exfb">Feedback (optional)</Label>
        <Textarea id="exfb" rows={2} value={fb} onChange={e => setFb(e.target.value)} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
        <p className="text-sm text-stone-600">Total <strong className="text-stone-900 tabular-nums">{total}/{max}</strong> · {percent(total, max)}% · {letter(percent(total, max))}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onSave(marks, fb, false)}>Save marks</Button>
          {remaining > 0 && <Button onClick={() => onSave(marks, fb, true)}>Save and mark next ({remaining})</Button>}
        </div>
      </div>
    </div>
  );
};
