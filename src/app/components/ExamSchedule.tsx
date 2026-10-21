import React, { useState } from 'react';
import { schoolLogo } from './BrandMark';
import { toast } from 'sonner';
import { useAuth, type Exam } from '@/app/context/AuthContext';
import { ExamTaking } from './ExamTaking';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Calendar, Clock, FileText, CheckCircle2, AlertCircle, Trophy, Play, CreditCard, Award, Hourglass, Printer } from 'lucide-react';
import { CertificatePaymentDialog } from './CertificatePaymentDialog';
import { Segmented, EmptyState, StatusPill, countdown, fmtDate } from './shell/ui';
import { Confetti } from './Confetti';
import { autoMark, examMax, percent, letter } from '@/app/lib/academics';
import { FEES } from '@/app/config/school';

export const ExamSchedule: React.FC = () => {
  const { user, exams, examAttempts, startExamAttempt, updateExamAttempt, submitExamAttempt, submitPayment, paymentClaims } = useAuth();
  const [view, setView] = useState<'available' | 'upcoming' | 'results'>('available');
  const [takingId, setTakingId] = useState<string | null>(null);
  const [certFor, setCertFor] = useState<Exam | null>(null);
  const [showCert, setShowCert] = useState<Exam | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  if (!user) return null;

  const now = new Date();
  const mine = exams.filter(e => user.courses.includes(e.courseId) && e.isPublished && e.questions.length > 0);
  const attemptFor = (examId: string) => examAttempts.find(a => a.examId === examId && a.studentId === user.id);
  const opensAt = (e: Exam) => new Date(new Date(e.scheduledDate).getTime() - 10 * 60000);

  const available = mine.filter(e => now >= opensAt(e) && !attemptFor(e.id)?.isSubmitted);
  const upcoming = mine.filter(e => now < opensAt(e)).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  const results = examAttempts.filter(a => a.studentId === user.id && a.isSubmitted).sort((a, b) => (b.endTime ?? '').localeCompare(a.endTime ?? ''));

  const certPaid = (e: Exam) => user.transactions?.some(t => t.description === `Certificate Fee: ${e.courseName}`);
  const certPending = (e: Exam) => paymentClaims.some(c => c.studentId === user.id && c.purpose === 'certificate' && c.courseName === e.courseName && c.status === 'pending');

  // Taking an exam: always pass the live attempt so answers and the timer stay in sync
  const takingExam = takingId ? exams.find(e => e.id === takingId) : undefined;
  const takingAttempt = takingExam ? attemptFor(takingExam.id) : undefined;
  if (takingExam && takingAttempt && !takingAttempt.isSubmitted) {
    return (
      <ExamTaking
        exam={takingExam}
        attempt={takingAttempt}
        onBack={() => setTakingId(null)}
        onUpdateAnswer={(attemptId, qid, answer) => updateExamAttempt(attemptId, { answers: { ...takingAttempt.answers, [qid]: answer } })}
        onSubmit={(attemptId, isAuto) => {
          submitExamAttempt(attemptId, isAuto);
          const { auto, needsMarking } = autoMark(takingExam, takingAttempt.answers);
          const pct = percent(auto, examMax(takingExam));
          setTakingId(null);
          setView('results');
          if (needsMarking) toast.success(isAuto ? 'Time is up. Your exam was submitted.' : 'Exam submitted', { description: 'Written answers will be marked by your lecturer.' });
          else if (pct >= FEES.passMark) { toast.success(`You passed with ${pct}%`); setCelebrate(true); setTimeout(() => setCelebrate(false), 2600); }
          else toast.info(`Exam submitted. Your score is ${pct}%.`);
        }}
      />
    );
  }

  const start = (e: Exam) => {
    startExamAttempt(e.id, user.id, user.name);
    setTakingId(e.id);
  };

  const ExamMeta = ({ e }: { e: Exam }) => (
    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-600">
      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-stone-400" />{fmtDate(e.scheduledDate, true)}</span>
      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-stone-400" />{e.duration} min</span>
      <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-stone-400" />{e.questions.length} questions · {examMax(e)} marks</span>
    </div>
  );

  return (
    <div className="space-y-5">
      <Confetti show={celebrate} />
      <Segmented id="exam-view" value={view} onChange={setView}
        options={[['available', `Available (${available.length})`], ['upcoming', `Upcoming (${upcoming.length})`], ['results', `Results (${results.length})`]]} />

      {view === 'available' && (available.length === 0
        ? <EmptyState icon={Play} title="No exams open right now" text="Exams open 10 minutes before their scheduled time. Check Upcoming for dates." />
        : <div className="grid gap-4">{available.map(e => {
            const a = attemptFor(e.id);
            return (
              <div key={e.id} className="bg-white rounded-2xl border-2 border-emerald-200 p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <StatusPill tone={a ? 'amber' : 'emerald'}>{a ? 'In progress' : 'Open now'}</StatusPill>
                  <span className="text-xs text-stone-500">{e.courseName}</span>
                </div>
                <h3 className="text-lg font-bold text-stone-900">{e.title}</h3>
                {e.description && <p className="text-sm text-stone-600 mt-1">{e.description}</p>}
                <div className="mt-3"><ExamMeta e={e} /></div>
                <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-stone-500 flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-amber-600" />The timer can't be paused. Answers save as you go and submit when time runs out.</p>
                  <Button onClick={() => start(e)} className="h-11 px-6"><Play className="w-4 h-4" />{a ? 'Resume exam' : 'Start exam'}</Button>
                </div>
              </div>
            );
          })}</div>)}

      {view === 'upcoming' && (upcoming.length === 0
        ? <EmptyState icon={Calendar} title="No upcoming exams" text="When your lecturers schedule exams, they'll appear here with the date and time." />
        : <div className="grid gap-3">{upcoming.map(e => (
            <div key={e.id} className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-stone-500">{e.courseName}</p>
                <h3 className="font-bold text-stone-900">{e.title}</h3>
                <div className="mt-2"><ExamMeta e={e} /></div>
              </div>
              <StatusPill tone="stone"><Hourglass className="w-3 h-3" />Opens {countdown(opensAt(e))}</StatusPill>
            </div>
          ))}</div>)}

      {view === 'results' && (results.length === 0
        ? <EmptyState icon={Trophy} title="No results yet" text="After you submit an exam, your score shows here. Written answers are marked by your lecturer." />
        : <div className="grid gap-4">{results.map(a => {
            const e = exams.find(x => x.id === a.examId);
            if (!e) return null;
            const max = examMax(e);
            const marked = !a.needsMarking && a.score !== undefined;
            const pct = marked ? percent(a.score!, max) : undefined;
            const passed = pct !== undefined && pct >= FEES.passMark;
            return (
              <div key={a.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {!marked ? <StatusPill tone="amber"><Hourglass className="w-3 h-3" />Awaiting marking</StatusPill>
                        : passed ? <StatusPill tone="green"><CheckCircle2 className="w-3 h-3" />Passed</StatusPill>
                        : <StatusPill tone="red">Not passed</StatusPill>}
                      {a.isAutoSubmitted && <StatusPill tone="stone">Submitted when time ran out</StatusPill>}
                    </div>
                    <h3 className="font-bold text-stone-900">{e.title}</h3>
                    <p className="text-sm text-stone-500">{e.courseName} · submitted {fmtDate(a.endTime!, true)}</p>
                  </div>
                  <div className="text-right">
                    {marked ? (
                      <>
                        <p className={`text-3xl font-bold tabular-nums ${passed ? 'text-emerald-700' : 'text-red-600'}`}>{pct}%</p>
                        <p className="text-xs text-stone-500 tabular-nums">{a.score}/{max} marks · {letter(pct!)}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-stone-700 tabular-nums">{a.autoScore ?? 0}/{max} so far</p>
                        <p className="text-xs text-stone-500">Written answers still to be marked</p>
                      </>
                    )}
                  </div>
                </div>
                {a.feedback && <p className="mt-3 text-sm bg-stone-50 border border-stone-100 rounded-lg p-3"><strong>Lecturer's feedback:</strong> {a.feedback}</p>}
                {passed && (
                  <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-stone-600 flex items-center gap-1.5"><Award className="w-4 h-4 text-amber-600" />You can get a certificate for this course.</p>
                    {certPaid(e) ? <Button onClick={() => setShowCert(e)} className="bg-emerald-700"><Award className="w-4 h-4" />View certificate</Button>
                      : certPending(e) ? <StatusPill tone="amber"><Hourglass className="w-3 h-3" />Certificate payment pending</StatusPill>
                      : <Button variant="outline" onClick={() => setCertFor(e)}><CreditCard className="w-4 h-4" />Get certificate (K {FEES.certificate})</Button>}
                  </div>
                )}
              </div>
            );
          })}</div>)}

      {certFor && (
        <CertificatePaymentDialog open onOpenChange={o => !o && setCertFor(null)} studentName={user.name} courseName={certFor.courseName} amount={FEES.certificate}
          onPaymentSuccess={d => {
            submitPayment({ purpose: 'certificate', courseId: certFor.courseId, courseName: certFor.courseName, amount: FEES.certificate, ...d });
            setCertFor(null);
          }} />
      )}

      <Dialog open={!!showCert} onOpenChange={o => !o && setShowCert(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="sr-only"><DialogTitle>Certificate</DialogTitle><DialogDescription>Your certificate of completion</DialogDescription></DialogHeader>
          {showCert && (() => {
            const a = attemptFor(showCert.id)!;
            const pct = percent(a.score ?? 0, examMax(showCert));
            const code = `ATC-C-${showCert.id.slice(-4).toUpperCase()}${user.id.slice(-4).toUpperCase()}`;
            return (
              <div className="space-y-4">
                <div className="relative rounded-xl border-[10px] border-double border-emerald-800 bg-gradient-to-br from-white to-emerald-50/60 p-6 sm:p-10 text-center">
                  <img src={schoolLogo} alt="" className="h-16 w-auto mx-auto" />
                  <p className="mt-2 text-xs font-semibold tracking-[0.3em] text-emerald-800">ALPHATECH COMPUTER INSTITUTE</p>
                  <h3 className="mt-3 text-2xl sm:text-3xl font-serif font-bold text-stone-900">Certificate of Completion</h3>
                  <p className="mt-5 text-stone-600">This certifies that</p>
                  <p className="mt-1 text-2xl font-serif font-semibold text-stone-900 border-b-2 border-stone-300 inline-block px-6 pb-1">{user.name}</p>
                  <p className="mt-4 text-stone-600">has successfully completed</p>
                  <p className="mt-1 text-xl font-semibold text-emerald-800">{showCert.courseName}</p>
                  <p className="mt-3 text-sm text-stone-600">with a final mark of <strong>{pct}% ({letter(pct)})</strong> on {fmtDate(a.endTime!)}</p>
                  <div className="mt-8 grid grid-cols-2 gap-6 text-xs text-stone-500">
                    <div className="border-t border-stone-400 pt-2">Director</div>
                    <div className="border-t border-stone-400 pt-2">{showCert.lecturerName}</div>
                  </div>
                  <p className="mt-6 text-[11px] text-stone-500">Verification code: <span className="font-mono font-semibold text-stone-700">{code}</span>{user.studentNumber && <> · Student no. {user.studentNumber}</>}</p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => window.print()}><Printer className="w-4 h-4" />Print or save as PDF</Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};
