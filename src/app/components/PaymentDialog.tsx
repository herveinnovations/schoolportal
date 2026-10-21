import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { CheckCircle, ArrowLeft, Clock, CalendarDays } from 'lucide-react';
import { PayToAlphatech, type PaymentDetails } from './PayToAlphatech';
import type { Course, Enrollment } from '@/app/context/AuthContext';
import { planCount } from '@/app/lib/finance';

export interface EnrolmentChoice {
  type: Enrollment['type'];
  paymentPlan: Enrollment['paymentPlan'];
  amountNow: number;
  payment: PaymentDetails;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course;
  studentName: string;
  onPaymentSuccess: (choice: EnrolmentChoice) => void;
}

const Choice: React.FC<{ selected: boolean; onClick: () => void; title: string; sub?: string; right?: React.ReactNode }> = ({ selected, onClick, title, sub, right }) => (
  <button type="button" role="radio" aria-checked={selected} onClick={onClick}
    className={`w-full flex items-center justify-between gap-3 text-left p-3 rounded-xl border-2 transition ${selected ? 'border-emerald-600 bg-emerald-50/60' : 'border-stone-200 hover:border-stone-300 bg-white'}`}>
    <span className="flex items-center gap-3">
      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? 'border-emerald-700' : 'border-stone-300'}`}>
        {selected && <span className="w-2 h-2 rounded-full bg-emerald-700" />}
      </span>
      <span>
        <span className="block text-sm font-medium text-stone-900">{title}</span>
        {sub && <span className="block text-xs text-stone-500">{sub}</span>}
      </span>
    </span>
    {right}
  </button>
);

export const PaymentDialog: React.FC<PaymentDialogProps> = ({ open, onOpenChange, course, studentName, onPaymentSuccess }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [type, setType] = useState<Enrollment['type']>('full-time');
  const [plan, setPlan] = useState<Enrollment['paymentPlan']>('installments-3');

  const amountNow = course.price / planCount(plan);

  const reset = () => { setStep(1); setType('full-time'); setPlan('installments-3'); };

  const handlePay = (payment: PaymentDetails) => {
    setStep(3);
    setTimeout(() => {
      onPaymentSuccess({ type, paymentPlan: plan, amountNow, payment });
      onOpenChange(false);
      reset();
    }, 1600);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 shadow-2xl">
        <div className="max-h-[90vh] overflow-y-auto">
          {step !== 3 && (
            <DialogHeader className="p-6 pb-2 text-left">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                <span className={step === 1 ? '' : 'text-stone-400'}>1 Your plan</span><span className="text-stone-300">/</span>
                <span className={step === 2 ? '' : 'text-stone-400'}>2 Payment</span>
              </div>
              <DialogTitle className="text-2xl font-bold text-stone-900">Enrol in {course.name}</DialogTitle>
              <DialogDescription>Total course fee: K {course.price.toLocaleString()}</DialogDescription>
            </DialogHeader>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-6 pb-6 space-y-5">
                <div role="radiogroup" aria-label="Study mode" className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-stone-700"><Clock className="w-4 h-4" />Study mode</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Choice selected={type === 'full-time'} onClick={() => setType('full-time')} title="Full time" sub="Day classes" />
                    <Choice selected={type === 'part-time'} onClick={() => setType('part-time')} title="Part time" sub="Evenings & weekends" />
                  </div>
                </div>
                <div role="radiogroup" aria-label="Payment plan" className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-stone-700"><CalendarDays className="w-4 h-4" />Payment plan</Label>
                  <Choice selected={plan === 'full'} onClick={() => setPlan('full')} title="Pay in full" sub="One payment now"
                    right={<span className="font-semibold text-stone-900 tabular-nums">K {course.price.toLocaleString()}</span>} />
                  <Choice selected={plan === 'installments-3'} onClick={() => setPlan('installments-3')} title="3 monthly instalments" sub="First one now, then every month"
                    right={<span className="font-semibold text-stone-900 tabular-nums">K {Math.round(course.price / 3).toLocaleString()}<span className="text-xs text-stone-500 font-normal">/mo</span></span>} />
                  <Choice selected={plan === 'installments-6'} onClick={() => setPlan('installments-6')} title="6 monthly instalments" sub="Smallest monthly amount"
                    right={<span className="font-semibold text-stone-900 tabular-nums">K {Math.round(course.price / 6).toLocaleString()}<span className="text-xs text-stone-500 font-normal">/mo</span></span>} />
                </div>
                <div className="flex items-center justify-between rounded-xl bg-stone-900 text-white px-4 py-3">
                  <span className="text-sm text-stone-300">Due now</span>
                  <span className="text-xl font-bold tabular-nums">K {amountNow.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <Button className="w-full h-11" onClick={() => setStep(2)}>Continue to payment</Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-6 pb-6 space-y-4">
                <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-1 text-sm text-stone-600 hover:text-emerald-700"><ArrowLeft className="w-4 h-4" />Change plan</button>
                <PayToAlphatech amount={amountNow} referenceHint={`${course.name.split(' ')[0].toUpperCase()} ${studentName}`} submitLabel="Submit payment and enrol" onSubmit={handlePay} />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-12 px-6 text-center">
                <div className="bg-green-100 p-4 rounded-full mb-4"><CheckCircle className="w-14 h-14 text-green-600" /></div>
                <h3 className="text-2xl font-bold text-stone-900 mb-2">You're enrolled</h3>
                <p className="text-stone-600">You can start <strong>{course.name}</strong> now. Your payment shows as pending until Finance confirms it.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
