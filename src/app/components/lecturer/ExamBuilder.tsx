import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { useAuth, type ExamQuestion } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Plus, Trash2, GripVertical } from 'lucide-react';

const blank = (type: ExamQuestion['type'] = 'multiple-choice'): ExamQuestion => ({
  id: `q${Math.random().toString(36).slice(2, 8)}`, question: '', type, marks: type === 'essay' ? 5 : 2,
  options: type === 'multiple-choice' ? ['', '', '', ''] : undefined, correctAnswer: type === 'true-false' ? 'True' : '',
});

const typeLabel: Record<ExamQuestion['type'], string> = {
  'multiple-choice': 'Multiple choice', 'true-false': 'True / false', 'short-answer': 'Short answer', essay: 'Essay (you mark it)',
};

/** Build an exam with questions. Multiple choice, true/false and short answers mark themselves. */
export const ExamBuilder: React.FC<{ open: boolean; onOpenChange: (o: boolean) => void }> = ({ open, onOpenChange }) => {
  const { user, courses, addExam } = useAuth();
  const myCourses = courses.filter(c => c.lecturerId === user?.id);
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [when, setWhen] = useState('');
  const [duration, setDuration] = useState('30');
  const [questions, setQuestions] = useState<ExamQuestion[]>([blank()]);

  if (!user) return null;
  const total = questions.reduce((s, q) => s + (Number(q.marks) || 0), 0);

  const update = (id: string, patch: Partial<ExamQuestion>) => setQuestions(qs => qs.map(q => (q.id === id ? { ...q, ...patch } : q)));
  const reset = () => { setCourseId(''); setTitle(''); setDescription(''); setWhen(''); setDuration('30'); setQuestions([blank()]); };

  const save = (publish: boolean) => {
    if (!courseId || !title.trim() || !when) { toast.error('Choose a course, give the exam a title and set the date and time'); return; }
    const bad = questions.findIndex(q => !q.question.trim()
      || (q.type === 'multiple-choice' && (q.options!.filter(o => o.trim()).length < 2 || !q.correctAnswer || !q.options!.includes(q.correctAnswer)))
      || !(Number(q.marks) > 0));
    if (bad >= 0) { toast.error(`Question ${bad + 1} is incomplete`, { description: 'Each question needs text and marks. Multiple choice needs at least 2 options and a correct answer.' }); return; }
    const course = courses.find(c => c.id === courseId)!;
    addExam({
      courseId, courseName: course.name, lecturerId: user.id, lecturerName: user.name, title: title.trim(), description: description.trim(),
      scheduledDate: new Date(when).toISOString(), duration: Number(duration) || 30, totalMarks: total,
      questions: questions.map(q => ({ ...q, marks: Number(q.marks), options: q.options?.filter(o => o.trim()), correctAnswer: q.type === 'essay' ? undefined : q.correctAnswer?.trim() || undefined })),
      isPublished: publish, createdAt: new Date().toISOString(),
    });
    toast.success(publish ? 'Exam scheduled. Students have been notified.' : 'Draft saved');
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle>Build an exam</DialogTitle>
          <DialogDescription>Multiple choice, true/false and short answers mark themselves. You mark essays.</DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Course</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger><SelectValue placeholder="Choose a course" /></SelectTrigger>
              <SelectContent>{myCourses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="ex-title">Title</Label><Input id="ex-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Networking Quiz 2" /></div>
          <div className="space-y-1.5"><Label htmlFor="ex-when">Opens at</Label><Input id="ex-when" type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="ex-dur">Time allowed (minutes)</Label><Input id="ex-dur" type="number" min={5} value={duration} onChange={e => setDuration(e.target.value)} /></div>
          <div className="sm:col-span-2 space-y-1.5"><Label htmlFor="ex-desc">Instructions (optional)</Label><Textarea id="ex-desc" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="What it covers and any rules" /></div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="font-semibold text-stone-900">Questions <span className="text-stone-400 font-normal">({questions.length})</span></p>
          <p className="text-sm text-stone-600">Total <strong className="tabular-nums">{total}</strong> marks</p>
        </div>

        <ol className="space-y-3">
          <AnimatePresence initial={false}>
            {questions.map((q, i) => (
              <motion.li key={q.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <GripVertical className="w-4 h-4 text-stone-300" />
                  <span className="text-sm font-semibold text-stone-700">Q{i + 1}</span>
                  <Select value={q.type} onValueChange={(t: ExamQuestion['type']) => update(q.id, { ...blank(t), id: q.id, question: q.question })}>
                    <SelectTrigger className="w-auto min-w-[170px] bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{(Object.keys(typeLabel) as ExamQuestion['type'][]).map(t => <SelectItem key={t} value={t}>{typeLabel[t]}</SelectItem>)}</SelectContent>
                  </Select>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Label htmlFor={`marks-${q.id}`} className="text-sm font-normal">Marks</Label>
                    <Input id={`marks-${q.id}`} type="number" min={1} className="w-16 bg-white" value={q.marks} onChange={e => update(q.id, { marks: Number(e.target.value) })} />
                    <Button type="button" variant="ghost" size="icon" aria-label={`Remove question ${i + 1}`} disabled={questions.length === 1} onClick={() => setQuestions(qs => qs.filter(x => x.id !== q.id))}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                </div>
                <Textarea aria-label={`Question ${i + 1}`} rows={2} className="bg-white" value={q.question} onChange={e => update(q.id, { question: e.target.value })} placeholder="Type the question" />
                {q.type === 'multiple-choice' && (
                  <div className="grid sm:grid-cols-2 gap-2" role="radiogroup" aria-label="Correct option">
                    {q.options!.map((o, j) => (
                      <label key={j} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${q.correctAnswer && q.correctAnswer === o && o ? 'bg-green-50 border-green-500 ring-1 ring-green-500' : 'bg-stone-100 border-transparent'}`}>
                        <input type="radio" name={`correct-${q.id}`} checked={!!o && q.correctAnswer === o} onChange={() => update(q.id, { correctAnswer: o })} aria-label={`Mark option ${j + 1} correct`} />
                        <input className="flex-1 bg-transparent outline-none text-sm" value={o} placeholder={`Option ${j + 1}`}
                          onChange={e => { const opts = [...q.options!]; const wasCorrect = q.correctAnswer === o; opts[j] = e.target.value; update(q.id, { options: opts, correctAnswer: wasCorrect ? e.target.value : q.correctAnswer }); }} />
                      </label>
                    ))}
                    <p className="sm:col-span-2 text-xs text-stone-500">Select the circle next to the correct answer.</p>
                  </div>
                )}
                {q.type === 'true-false' && (
                  <div className="flex gap-2">
                    {['True', 'False'].map(v => (
                      <button key={v} type="button" onClick={() => update(q.id, { correctAnswer: v })} className={`px-4 py-1.5 rounded-full text-sm border ${q.correctAnswer === v ? 'bg-green-600 text-white border-green-600' : 'bg-stone-100 border-transparent'}`}>{v} is correct</button>
                    ))}
                  </div>
                )}
                {q.type === 'short-answer' && (
                  <div className="space-y-1">
                    <Input className="bg-white" value={q.correctAnswer ?? ''} onChange={e => update(q.id, { correctAnswer: e.target.value })} placeholder="Expected answer (leave empty to mark it yourself)" aria-label="Expected answer" />
                    <p className="text-xs text-stone-500">Matched ignoring capital letters and extra spaces.</p>
                  </div>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(typeLabel) as ExamQuestion['type'][]).map(t => (
            <Button key={t} type="button" variant="outline" size="sm" onClick={() => setQuestions(qs => [...qs, blank(t)])}><Plus className="w-3.5 h-3.5" />{typeLabel[t].split(' (')[0]}</Button>
          ))}
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-stone-100">
          <Button variant="outline" onClick={() => save(false)}>Save as draft</Button>
          <Button onClick={() => save(true)}>Schedule exam</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
