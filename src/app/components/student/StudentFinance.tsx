import React, { useState } from 'react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import { schoolLogo } from '../BrandMark';
import { useAuth, type PaymentClaim } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Wallet, Download, CheckCircle2, Hourglass, AlertTriangle, CircleDot, Receipt, CheckCircle } from 'lucide-react';
import { SectionTitle, Stat, StatusPill, EmptyState, fmtDate } from '../shell/ui';
import { CountUp } from '../CountUp';
import { instalments, kwacha, planLabel, studentFinance } from '@/app/lib/finance';
import { PayToAlphatech } from '../PayToAlphatech';
import { PAY_TO } from '@/app/config/school';

const methodLabel = (m: PaymentClaim['method']) => PAY_TO[m].label;
const purposeLabel = (c: PaymentClaim) => (c.purpose === 'registration' ? 'Registration fee' : c.purpose === 'certificate' ? `Certificate: ${c.courseName}` : `Course fee: ${c.courseName}`);

/** Pay an instalment (or any amount) towards a course. */
export const InstalmentPaymentDialog: React.FC<{ courseId: string; amount: number; onClose: () => void }> = ({ courseId, amount, onClose }) => {
  const { user, courses, submitPayment } = useAuth();
  const [done, setDone] = useState(false);
  const course = courses.find(c => c.id === courseId);
  if (!user || !course) return null;
  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0">
        {done ? (
          <div className="flex flex-col items-center py-12 px-6 text-center">
            <div className="bg-green-100 p-4 rounded-full mb-4"><CheckCircle className="w-12 h-12 text-green-600" /></div>
            <h3 className="text-xl font-bold text-stone-900">Payment submitted</h3>
            <p className="text-stone-600 mt-1">It shows as pending until Finance confirms it.</p>
          </div>
        ) : (
          <div className="max-h-[90vh] overflow-y-auto">
            <DialogHeader className="p-6 pb-2 text-left">
              <DialogTitle className="text-xl font-bold">Pay {kwacha(amount)}</DialogTitle>
              <DialogDescription>Towards {course.name}</DialogDescription>
            </DialogHeader>
            <div className="px-6 pb-6">
              <PayToAlphatech amount={amount} referenceHint={`${course.name.split(' ')[0].toUpperCase()} ${user.name}`}
                onSubmit={d => {
                  submitPayment({ purpose: 'course_fee', courseId, courseName: course.name, amount, ...d });
                  setDone(true);
                  setTimeout(onClose, 1500);
                }} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const StudentFinance: React.FC<{ onPay: (courseId: string, amount: number) => void; onResubmitRegistration: () => void }> = ({ onPay, onResubmitRegistration }) => {
  const { user, courses, paymentClaims } = useAuth();
  if (!user) return null;
  const fin = studentFinance(user, paymentClaims);
  const enrolments = user.enrollments ?? [];

  // History: every submitted payment, plus older payments recorded before the confirmation step existed
  const claimIds = new Set(fin.claims.map(c => c.id));
  const legacy = (user.transactions ?? []).filter(t => !claimIds.has(t.id) && !fin.claims.some(c => c.status === 'confirmed' && c.amount === t.amount && c.submittedAt.slice(0, 10) === t.date.slice(0, 10)));
  const history = [
    ...fin.claims.map(c => ({ id: c.id, date: c.submittedAt, what: purposeLabel(c), amount: c.amount, status: c.status, method: methodLabel(c.method), ref: c.reference, reason: c.rejectionReason })),
    ...legacy.map(t => ({ id: t.id, date: t.date, what: t.description, amount: t.amount, status: 'confirmed' as const, method: '—', ref: '—', reason: undefined })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const receipt = (h: typeof history[number]) => {
    const doc = new jsPDF();
    try { doc.addImage(schoolLogo, 'PNG', 172, 10, 18, 21); } catch { /* logo is optional */ }
    doc.setFontSize(20); doc.setTextColor(4, 120, 87); doc.text('Alphatech Computer Institute', 20, 22);
    doc.setFontSize(12); doc.setTextColor(0, 0, 0); doc.text('Official payment receipt', 20, 30);
    const rows: [string, string][] = [
      ['Receipt no.', h.id.toUpperCase()], ['Date', fmtDate(h.date)], ['Student', user.name], ['Student no.', user.studentNumber ?? 'Pending'],
      ['For', h.what], ['Amount', `ZMW ${h.amount.toLocaleString()}`], ['Paid by', h.method], ['Reference', h.ref], ['Status', 'Confirmed'],
    ];
    rows.forEach(([k, v], i) => { doc.text(`${k}:`, 20, 50 + i * 9); doc.text(v, 70, 50 + i * 9); });
    doc.save(`alphatech-receipt-${h.id}.pdf`);
  };

  return (
    <div className="space-y-8">
      {fin.registration?.status === 'rejected' && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="flex-1 min-w-[200px] text-sm text-red-900"><strong>Registration payment not confirmed:</strong> {fin.registration.rejectionReason ?? 'reference not found'}.</p>
          <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={onResubmitRegistration}>Resubmit</Button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat label="Total fees" value={<CountUp value={fin.totalFees} prefix="K " />} hint={`${enrolments.length} course${enrolments.length === 1 ? '' : 's'}`} />
        <Stat label="Paid" value={<CountUp value={fin.paidFees} prefix="K " />} tone="text-emerald-700" hint="Confirmed by Finance" />
        <Stat label="Waiting for confirmation" value={<CountUp value={fin.pending} prefix="K " />} tone="text-amber-700" hint={fin.pending ? 'Usually within 1 working day' : 'Nothing pending'} />
        <Stat label="Balance" value={<CountUp value={fin.balance} prefix="K " />} tone={fin.overdue.length ? 'text-red-600' : 'text-stone-900'} hint={fin.next ? `Next: ${kwacha(fin.next.amount)} on ${fmtDate(fin.next.due)}` : fin.balance ? '' : 'All paid up'} />
      </div>

      <section>
        <SectionTitle title="Instalments" sub="What you owe for each course and when it's due." />
        {enrolments.length === 0 ? (
          <EmptyState icon={Wallet} title="No course fees yet" text="When you enrol in a course, its payment plan and due dates appear here." />
        ) : (
          <div className="grid gap-4">
            {enrolments.map(e => {
              const course = courses.find(c => c.id === e.courseId);
              const rows = instalments(e, fin.claims);
              const next = rows.find(r => r.status === 'overdue' || r.status === 'due' || r.status === 'upcoming');
              const pct = e.totalAmount ? Math.round((e.amountPaid / e.totalAmount) * 100) : 0;
              return (
                <div key={e.courseId} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-stone-900">{course?.name ?? 'Course'}</h3>
                      <p className="text-xs text-stone-500">{planLabel(e.paymentPlan)} · {e.type.replace('-', ' ')} · enrolled {fmtDate(e.enrolledAt)}</p>
                    </div>
                    {next && <Button size="sm" onClick={() => onPay(e.courseId, next.amount)} className={next.status === 'overdue' ? 'bg-red-600 hover:bg-red-700' : ''}>Pay {kwacha(next.amount)}</Button>}
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-stone-500 mb-1.5 tabular-nums"><span>{kwacha(e.amountPaid)} of {kwacha(e.totalAmount)} paid</span><span>{pct}%</span></div>
                    <div className="h-2 rounded-full bg-stone-100 overflow-hidden"><motion.div className="h-full bg-emerald-600 rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9 }} /></div>
                  </div>
                  <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {rows.map(r => (
                      <li key={r.index} className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${r.status === 'overdue' ? 'border-red-200 bg-red-50' : r.status === 'paid' ? 'border-emerald-100 bg-emerald-50/50' : 'border-stone-200'}`}>
                        <span className="flex items-center gap-2 min-w-0">
                          {r.status === 'paid' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : r.status === 'pending' ? <Hourglass className="w-4 h-4 text-amber-600 shrink-0" /> : r.status === 'overdue' ? <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" /> : <CircleDot className="w-4 h-4 text-stone-400 shrink-0" />}
                          <span className="truncate"><span className="font-medium text-stone-800">#{r.index}</span> <span className="text-stone-500">{fmtDate(r.due)}</span></span>
                        </span>
                        <span className="font-semibold tabular-nums text-stone-900">{kwacha(r.amount)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionTitle title="Payment history" sub="Every payment you've submitted and whether Finance has confirmed it." />
        {history.length === 0 ? (
          <EmptyState icon={Receipt} title="No payments yet" text="Payments you submit will appear here with their status." />
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm divide-y divide-stone-100">
            {history.map(h => (
              <div key={h.id} className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3.5">
                <div className="flex-1 min-w-[180px]">
                  <p className="font-medium text-stone-900">{h.what}</p>
                  <p className="text-xs text-stone-500">{fmtDate(h.date)} · {h.method}{h.ref !== '—' && <> · ref <span className="font-mono">{h.ref}</span></>}</p>
                  {h.reason && <p className="text-xs text-red-600 mt-0.5">{h.reason}</p>}
                </div>
                <span className="font-semibold tabular-nums text-stone-900">{kwacha(h.amount)}</span>
                {h.status === 'confirmed' ? <StatusPill tone="green">Confirmed</StatusPill> : h.status === 'pending' ? <StatusPill tone="amber">Pending</StatusPill> : <StatusPill tone="red">Not confirmed</StatusPill>}
                {h.status === 'confirmed' && <Button variant="ghost" size="icon" aria-label="Download receipt" onClick={() => receipt(h)}><Download className="w-4 h-4" /></Button>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
