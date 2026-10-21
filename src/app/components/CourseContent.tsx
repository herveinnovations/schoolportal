import React, { useState } from 'react';
import { type Course, useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { LectureRecordings } from './LectureRecordings';
import { AssignmentView } from './AssignmentView';
import { ArrowLeft, User, BookOpen } from 'lucide-react';
import { Segmented, ProgressRing } from './shell/ui';
import { courseProgress } from '@/app/lib/academics';

interface CourseContentProps {
  course: Course;
  onBack: () => void;
}

/** One course: recordings and assignments, shown inside the dashboard. */
export const CourseContent: React.FC<CourseContentProps> = ({ course, onBack }) => {
  const { user, homeworks, homeworkSubmissions, exams, examAttempts } = useAuth();
  const [view, setView] = useState<'recordings' | 'assignments'>('recordings');
  const prog = user ? courseProgress(course.id, user.id, homeworks, homeworkSubmissions, exams, examAttempts) : { pct: 0, done: 0, total: 0 };

  return (
    <div className="space-y-5">
      <Button variant="ghost" onClick={onBack} className="-ml-2"><ArrowLeft className="w-4 h-4" />All courses</Button>
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 flex flex-wrap items-center gap-5 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0"><BookOpen className="w-6 h-6" /></div>
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-xl font-bold text-stone-900">{course.name}</h2>
          <p className="text-sm text-stone-600 mt-1 max-w-prose">{course.description}</p>
          <p className="text-xs text-stone-500 mt-2 flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{course.lecturerName} · {course.credits} credits</p>
        </div>
        <div className="flex items-center gap-3">
          <ProgressRing pct={prog.pct} />
          <div className="text-sm"><p className="font-semibold text-stone-900">Your progress</p><p className="text-stone-500">{prog.done} of {prog.total} tasks done</p></div>
        </div>
      </div>
      <Segmented id="course-view" value={view} onChange={setView} options={[['recordings', 'Recordings'], ['assignments', 'Assignments']]} />
      {view === 'recordings' ? <LectureRecordings courseId={course.id} /> : <AssignmentView courseId={course.id} />}
    </div>
  );
};
