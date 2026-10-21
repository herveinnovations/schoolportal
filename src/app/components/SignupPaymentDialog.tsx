import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { PayToAlphatech, type PaymentDetails } from './PayToAlphatech';
import { FEES } from '@/app/config/school';

interface SignupPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  onPaymentSuccess: (details: PaymentDetails) => void;
}

export const SignupPaymentDialog: React.FC<SignupPaymentDialogProps> = ({ open, onOpenChange, studentName, onPaymentSuccess }) => {
  const [done, setDone] = useState(false);

  const handle = (d: PaymentDetails) => {
    setDone(true);
    setTimeout(() => { onPaymentSuccess(d); setDone(false); }, 1600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 shadow-2xl">
        {done ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="bg-green-100 p-4 rounded-full mb-4"><CheckCircle className="w-14 h-14 text-green-600" /></div>
            <h3 className="text-2xl font-bold text-stone-900 mb-2">Payment submitted</h3>
            <p className="text-stone-600">Welcome to <strong>Alphatech Computer Institute</strong>, {studentName}. You can use your dashboard now. Your student number is issued once Finance confirms the fee.</p>
          </div>
        ) : (
          <div className="max-h-[90vh] overflow-y-auto">
            <DialogHeader className="p-6 pb-2 text-left">
              <DialogTitle className="text-2xl font-bold text-stone-900">Pay the registration fee</DialogTitle>
              <DialogDescription>A once-off fee of K {FEES.registration} for {studentName}.</DialogDescription>
            </DialogHeader>
            <div className="px-6 pb-6 space-y-5">
              <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200/60 flex gap-3 text-sm text-emerald-900">
                <AlertCircle className="w-5 h-5 text-emerald-700 shrink-0" />
                <p>Every student pays this once. It covers your registration, student number and portal access.</p>
              </div>
              <PayToAlphatech amount={FEES.registration} referenceHint={`REG ${studentName}`} submitLabel={`Submit K ${FEES.registration} payment`} onSubmit={handle} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
