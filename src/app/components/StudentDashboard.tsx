import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAuth, type Course, type Notification } from '@/app/context/AuthContext';
import { Tabs, TabsContent } from '@/app/components/ui/tabs';
import { Home, BookOpen, Video, CalendarDays, PlayCircle, FileText, ClipboardCheck, GraduationCap, Wallet, Award, User } from 'lucide-react';
import { DashboardShell, type NavItem } from './shell/DashboardShell';
import { NotificationBell } from './shell/NotificationBell';
import { EmptyState } from './shell/ui';
import { LiveStream } from './LiveStream';
import { CourseContent } from './CourseContent';
import { PaymentDialog } from './PaymentDialog';
import { SignupPaymentDialog } from './SignupPaymentDialog';
import { ExamSchedule } from './ExamSchedule';
import { LectureRecordings } from './LectureRecordings';
import { AssignmentView } from './AssignmentView';
import { RegistrationForm } from './RegistrationForm';
import { StudentHome } from './student/StudentHome';
import { StudentCourses } from './student/StudentCourses';
import { StudentFinance, InstalmentPaymentDialog } from './student/StudentFinance';
import { StudentLive, StudentSchedule, StudentResults, StudentCertificates, StudentProfile } from './student/StudentPages';
import { studentFinance } from '@/app/lib/finance';
import { FEES } from '@/app/config/school';

export const StudentDashboard: React.FC = () => {
  const { user, logout, liveClasses, homeworks, homeworkSubmissions, exams, examAttempts, paymentClaims, enrollInCourse, submitPayment, recordAttendance } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [enrolCourse, setEnrolCourse] = useState<Course | null>(null);
  const [payFor, setPayFor] = useState<{ courseId: string; amount: number } | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showRegPayment, setShowRegPayment] = useState(false);
  const [inAppClass, setInAppClass] = useState<string | null>(null);

  if (!user) return null;
  const now = Date.now();
  const registered = !!user.personalDetails?.hasCompletedRegistration;
  const fin = studentFinance(user, paymentClaims);

  const pendingWork = homeworks.filter(h => user.courses.includes(h.courseId) && !homeworkSubmissions.some(s => s.homeworkId === h.id && s.studentId === user.id) && new Date(h.dueDate).getTime() > now).length;
  const openExams = exams.filter(e => user.courses.includes(e.courseId) && e.isPublished && e.questions.length && new Date(e.scheduledDate).getTime() - 600000 <= now && !examAttempts.some(a => a.examId === e.id && a.studentId === user.id && a.isSubmitted)).length;
  const liveNow = liveClasses.filter(l => l.isLive && user.courses.includes(l.courseId)).length;

  const items: NavItem[] = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'courses', label: 'My courses', icon: BookOpen },
    { id: 'live', label: 'Live classes', icon: Video, badge: liveNow, section: 'Learning' },
    { id: 'timetable', label: 'Timetable', icon: CalendarDays, section: 'Learning' },
    { id: 'recordings', label: 'Recordings', icon: PlayCircle, section: 'Learning' },
    { id: 'assignment', label: 'Assignments', icon: FileText, badge: pendingWork, section: 'Learning' },
    { id: 'exams', label: 'Exams', icon: ClipboardCheck, badge: openExams, section: 'Learning' },
    { id: 'results', label: 'Results', icon: GraduationCap, section: 'Learning' },
    { id: 'finance', label: 'Payments', icon: Wallet, badge: fin.overdue.length + (fin.registration?.status === 'rejected' ? 1 : 0), section: 'Account' },
    { id: 'certificates', label: 'Certificates', icon: Award, section: 'Account' },
    { id: 'profile', label: 'Profile', icon: User, section: 'Account' },
  ];

  const go = (t: string) => { setViewingCourse(null); setTab(t); };

  const join = (liveClassId: string) => {
    const lc = liveClasses.find(l => l.id === liveClassId);
    if (!lc) return;
    recordAttendance(lc.id, user.id, 'auto');
    if (lc.meetingUrl) {
      // Open the lecturer's Zoom / Meet / Jitsi room in a new tab
      const a = document.createElement('a');
      a.href = lc.meetingUrl; a.target = '_blank'; a.rel = 'noreferrer';
      a.click();
      toast.success('Opening the class', { description: 'Your attendance has been recorded.' });
    } else {
      setInAppClass(lc.id);
    }
  };

  const tryEnrol = (c: Course) => {
    if (!registered) { toast.info('Complete your registration form first'); setShowRegistration(true); return; }
    if (!user.studentNumber) { toast.info('Waiting for Finance to confirm your registration fee', { description: 'You can enrol as soon as your student number is issued. We’ll notify you.' }); return; }
    setEnrolCourse(c);
  };

  const onNotification = (n: Notification) => {
    if (n.type.startsWith('live_class')) go('live');
    else if (n.type.startsWith('payment')) go('finance');
    else if (n.type.startsWith('exam')) go('exams');
    else if (n.type.startsWith('assignment')) go('assignment');
    else if (n.type === 'new_material') go('recordings');
    else go('dashboard');
  };

  if (inAppClass) {
    const lc = liveClasses.find(l => l.id === inAppClass);
    if (lc) return <LiveStream classInfo={lc} onBack={() => setInAppClass(null)} isLecturer={false} />;
  }

  const needCourses = (node: React.ReactNode, icon: typeof Video, title: string) =>
    user.courses.length === 0
      ? <EmptyState icon={icon} title={title} text="Enrol in a course to get started." action={<button className="text-sm font-semibold text-emerald-700 hover:underline" onClick={() => go('courses')}>Browse courses</button>} />
      : node;

  return (
    <DashboardShell
      portal="Student"
      user={user}
      items={items}
      active={tab}
      onNavigate={go}
      primary={['dashboard', 'courses', 'assignment', 'finance']}
      onLogout={logout}
      subtitle={user.studentNumber ?? undefined}
      actions={<NotificationBell onOpen={onNotification} />}
    >
      {viewingCourse ? (
        <CourseContent course={viewingCourse} onBack={() => setViewingCourse(null)} />
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsContent value="dashboard">
            <StudentHome go={go} openCourse={setViewingCourse} onRegister={() => setShowRegistration(true)} onResubmitRegistration={() => setShowRegPayment(true)}
              onPay={(courseId, amount) => setPayFor({ courseId, amount })} onJoin={join} />
          </TabsContent>
          <TabsContent value="courses"><StudentCourses openCourse={setViewingCourse} onEnrol={tryEnrol} canEnrol={registered && !!user.studentNumber} /></TabsContent>
          <TabsContent value="live"><StudentLive onJoin={join} /></TabsContent>
          <TabsContent value="timetable"><StudentSchedule go={go} /></TabsContent>
          <TabsContent value="recordings">{needCourses(<LectureRecordings />, PlayCircle, 'No recordings yet')}</TabsContent>
          <TabsContent value="assignment">{needCourses(<AssignmentView />, FileText, 'No assignments yet')}</TabsContent>
          <TabsContent value="exams">{needCourses(<ExamSchedule />, ClipboardCheck, 'No exams yet')}</TabsContent>
          <TabsContent value="results"><StudentResults /></TabsContent>
          <TabsContent value="finance"><StudentFinance onPay={(courseId, amount) => setPayFor({ courseId, amount })} onResubmitRegistration={() => setShowRegPayment(true)} /></TabsContent>
          <TabsContent value="certificates"><StudentCertificates go={go} /></TabsContent>
          <TabsContent value="profile"><StudentProfile /></TabsContent>
        </Tabs>
      )}

      {enrolCourse && (
        <PaymentDialog open course={enrolCourse} studentName={user.name} onOpenChange={o => !o && setEnrolCourse(null)}
          onPaymentSuccess={({ type, paymentPlan, amountNow, payment }) => {
            enrollInCourse(enrolCourse.id, type, paymentPlan);
            submitPayment({ purpose: 'course_fee', courseId: enrolCourse.id, courseName: enrolCourse.name, amount: Math.round(amountNow * 100) / 100, ...payment });
            toast.success(`You're enrolled in ${enrolCourse.name}`);
            setEnrolCourse(null);
          }} />
      )}
      {payFor && <InstalmentPaymentDialog courseId={payFor.courseId} amount={Math.round(payFor.amount * 100) / 100} onClose={() => setPayFor(null)} />}
      {showRegistration && <RegistrationForm open={showRegistration} onOpenChange={setShowRegistration} onComplete={() => setShowRegistration(false)} />}
      <SignupPaymentDialog open={showRegPayment} onOpenChange={setShowRegPayment} studentName={user.name}
        onPaymentSuccess={d => { submitPayment({ purpose: 'registration', amount: FEES.registration, ...d }); setShowRegPayment(false); }} />
    </DashboardShell>
  );
};
