import { useAuth } from '@/app/context/AuthContext';

/** Exams and attempts now live in the shared app state, so students, lecturers and staff all see the same results. */
export const useExams = () => {
  const { exams, examAttempts, addExam, updateExam, deleteExam, startExamAttempt, updateExamAttempt, submitExamAttempt } = useAuth();
  return {
    exams,
    examAttempts,
    addExam,
    updateExam,
    deleteExam,
    startExamAttempt,
    updateExamAttempt,
    submitExamAttempt,
    getExamAttempt: (examId: string, studentId: string) => examAttempts.find(a => a.examId === examId && a.studentId === studentId),
    hasAttemptedExam: (examId: string, studentId: string) => examAttempts.some(a => a.examId === examId && a.studentId === studentId),
  };
};
