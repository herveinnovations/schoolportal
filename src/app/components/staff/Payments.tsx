import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { useAuth, type PaymentClaim } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Check, X, Search, Wallet, Smartphone, Landmark, Banknote, Copy } from 'lucide-react';
import { EmptyState, Segmented, StatusPill, fmtDate } from '../shell/ui';
import { kwacha } from '@/app/lib/finance';

const methodLabel: Record<PaymentClaim['method'], string> = { mtn: 'MTN MoMo', airtel: 'Airtel Money', bank: 'Bank deposit', cash: 'Cash' };
const methodIcon = { mtn: Smartphone, airtel: Smartphone, bank: Landmark, cash: Banknote };
const purposeLabel = (c: PaymentClaim) => (c.purpose === 'registration' ? 'Admission form fee' : c.purpose === 'certificate' ? `Certificate · ${c.courseName}` : `Course fee · ${c.courseName}`);
const REASONS = ['Reference not found in our statement', 'Amount received is different', 'Duplicate of an earlier payment'];

/** Finance checks each student's payment reference against the MoMo / bank statement, then confirms or rejects it. */
export const Payments: React.FC = () => {
  const { users, paymentClaims, reviewPayment } = useAuth();
  const [view, setView] = useState<'pending' | 'confirmed' | 'rejected'>('pending');
  const [q, setQ] = useState('');
  const [rejecting, setRejecting] = useState<PaymentClaim | null>(null);
  const [reason, setReason] = useState('');

  const counts = { pending: 0, confirmed: 0, rejected: 0 };
  paymentClaims.forEach(c => { counts[c.status]++; });
  const list = paymentClaims
    .filter(c => c.status === view)
    .filter(c => !q.trim() || `${c.studentName} ${c.reference} ${c.courseName ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (view === 'pending' ? a.submittedAt.localeCompare(b.submittedAt) : (b.reviewedAt ?? '').localeCompare(a.reviewedAt ?? '')));

  const confirm = (c: PaymentClaim) => {
    reviewPayment(c.id, 'confirmed');
    toast.success(`Confirmed ${kwacha(c.amount)} from ${c.studentName}`, { description: c.purpose === 'registration' ? 'A student number has been issued.' : 'Their balance has been updated.' });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented id="pay-view" value={view} onChange={setView} options={[['pending', `To check (${counts.pending})`], ['confirmed', `Confirmed (${counts.confirmed})`], ['rejected', `Rejected (${counts.rejected})`]]} />
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input aria-label="Search payments" className="pl-9" placeholder="Name or reference" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>
      {view === 'pending' && counts.pending > 0 && (
        <p className="text-sm text-stone-600 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">Check each reference against your MTN, Airtel or bank statement before confirming. Confirming updates the student's balance straight away.</p>
      )}

      {list.length === 0 ? (
        <EmptyState icon={Wallet} title={view === 'pending' ? 'No payments to check' : `No ${view} payments`} text={view === 'pending' ? 'When a student submits a payment reference it appears here.' : 'Nothing here yet.'} />
      ) : (
        <ul className="grid gap-3">
          <AnimatePresence initial={false}>
            {list.map(c => {
              const Icon = methodIcon[c.method];
              const student = users.find(u => u.id === c.studentId);
              return (
                <motion.li key={c.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                  className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-5 flex flex-wrap items-center gap-4">
                  <span className="w-11 h-11 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></span>
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-semibold text-stone-900">{c.studentName} <span className="font-normal text-stone-400 text-sm">{student?.studentNumber ?? ''}</span></p>
                    <p className="text-sm text-stone-600">{purposeLabel(c)}</p>
                    <p className="text-xs text-stone-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>{methodLabel[c.method]}</span>
                      <button className="inline-flex items-center gap-1 font-mono text-stone-700 hover:text-emerald-700" onClick={() => { navigator.clipboard?.writeText(c.reference).catch(() => {}); toast.success('Reference copied'); }} aria-label={`Copy reference ${c.reference}`}>
                        Ref {c.reference}<Copy className="w-3 h-3" />
                      </button>
                      {c.payerPhone && <span>From {c.payerPhone}</span>}
                      <span>{fmtDate(c.submittedAt, true)}</span>
                    </p>
                    {c.note && <p className="text-xs text-stone-500 mt-1 italic">"{c.note}"</p>}
                    {c.status === 'rejected' && c.rejectionReason && <p className="text-xs text-red-600 mt-1">Reason: {c.rejectionReason}</p>}
                    {c.status !== 'pending' && <p className="text-xs text-stone-400 mt-1">{c.status === 'confirmed' ? 'Confirmed' : 'Rejected'} by {c.reviewedBy} · {c.reviewedAt && fmtDate(c.reviewedAt, true)}</p>}
                  </div>
                  <p className="text-xl font-bold text-stone-900 tabular-nums">{kwacha(c.amount)}</p>
                  {c.status === 'pending' ? (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => { setRejecting(c); setReason(''); }}><X className="w-4 h-4" />Reject</Button>
                      <Button className="flex-1 sm:flex-none" onClick={() => confirm(c)}><Check className="w-4 h-4" />Confirm</Button>
                    </div>
                  ) : (
                    <StatusPill tone={c.status === 'confirmed' ? 'green' : 'red'}>{c.status === 'confirmed' ? 'Confirmed' : 'Rejected'}</StatusPill>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <Dialog open={!!rejecting} onOpenChange={o => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader className="text-left">
            <DialogTitle>Reject this payment?</DialogTitle>
            <DialogDescription>{rejecting && `${rejecting.studentName} · ${kwacha(rejecting.amount)} · ref ${rejecting.reference}. They'll be told why and can resubmit.`}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {REASONS.map(r => <button key={r} onClick={() => setReason(r)} className={`px-3 py-1.5 rounded-full text-xs border transition ${reason === r ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 hover:border-stone-300'}`}>{r}</button>)}
            </div>
            <div className="space-y-1.5"><Label htmlFor="rej-reason">Reason</Label><Input id="rej-reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="Tell the student what to fix" /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => {
                if (!rejecting) return;
                if (!reason.trim()) { toast.error('Add a reason so the student knows what to fix'); return; }
                reviewPayment(rejecting.id, 'rejected', reason.trim());
                toast.success('Payment rejected. The student has been told.');
                setRejecting(null);
              }}>Reject payment</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
