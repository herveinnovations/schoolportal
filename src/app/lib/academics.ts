import type { Exam, ExamAttempt, ExamQuestion, HomeworkSubmission, Homework } from '@/app/context/AuthContext';

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export const isObjective = (q: ExamQuestion) => q.type !== 'essay' && !!q.correctAnswer;

/** Marks every question that has a correct answer. Essays (or questions without an answer key) wait for the lecturer. */
export function autoMark(exam: Exam, answers: Record<string, string>) {
  let auto = 0;
  let needsMarking = false;
  for (const q of exam.questions) {
    if (isObjective(q)) {
      if (answers[q.id] && norm(answers[q.id]) === norm(q.correctAnswer!)) auto += q.marks;
    } else if (answers[q.id]?.trim()) {
      needsMarking = true;
    }
  }
  return { auto, needsMarking };
}

export const examMax = (exam: Exam) => exam.questions.reduce((s, q) => s + q.marks, 0) || exam.totalMarks || 0;

/** Final score once marked, or undefined while essays are waiting. */
export const attemptScore = (a: ExamAttempt) => (a.isSubmitted && !a.needsMarking ? a.score : undefined);

export const percent = (score: number, max: number) => (max > 0 ? Math.round((score / max) * 100) : 0);

export function letter(p: number) {
  if (p >= 86) return 'A+';
  if (p >= 76) return 'A';
  if (p >= 66) return 'B+';
  if (p >= 56) return 'B';
  if (p >= 50) return 'C+';
  if (p >= 40) return 'C';
  return 'D';
}

export const letterTone = (p: number) => (p >= 66 ? 'text-emerald-700' : p >= 50 ? 'text-amber-700' : 'text-red-600');

/** A student's progress in a course: work submitted out of work set. */
export function courseProgress(courseId: string, studentId: string, homeworks: Homework[], subs: HomeworkSubmission[], exams: Exam[], attempts: ExamAttempt[]) {
  const hw = homeworks.filter(h => h.courseId === courseId);
  const ex = exams.filter(e => e.courseId === courseId && e.isPublished && e.questions.length > 0);
  const doneHw = hw.filter(h => subs.some(s => s.homeworkId === h.id && s.studentId === studentId)).length;
  const doneEx = ex.filter(e => attempts.some(a => a.examId === e.id && a.studentId === studentId && a.isSubmitted)).length;
  const total = hw.length + ex.length;
  return { done: doneHw + doneEx, total, pct: total ? Math.round(((doneHw + doneEx) / total) * 100) : 0 };
}

/** Overall course mark: average of graded assignments (%) and marked exams (%), equally weighted per item. */
export function courseMark(courseId: string, studentId: string, homeworks: Homework[], subs: HomeworkSubmission[], exams: Exam[], attempts: ExamAttempt[]) {
  const parts: number[] = [];
  homeworks.filter(h => h.courseId === courseId).forEach(h => {
    const s = subs.find(x => x.homeworkId === h.id && x.studentId === studentId);
    if (s?.grade !== undefined) parts.push(s.grade);
  });
  exams.filter(e => e.courseId === courseId).forEach(e => {
    const a = attempts.find(x => x.examId === e.id && x.studentId === studentId);
    const sc = a ? attemptScore(a) : undefined;
    if (sc !== undefined) parts.push(percent(sc, examMax(e)));
  });
  return parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : undefined;
}
