import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Award, CheckCircle } from 'lucide-react';
import { PayToAlphatech, type PaymentDetails } from './PayToAlphatech';

interface CertificatePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  courseName: string;
  amount: number;
  onPaymentSuccess: (details: PaymentDetails) => void;
}

export const CertificatePaymentDialog: React.FC<CertificatePaymentDialogProps> = ({ open, onOpenChange, studentName, courseName, amount, onPaymentSuccess }) => {
  const [done, setDone] = useState(false);
  const handle = (d: PaymentDetails) => {
    setDone(true);
    setTimeout(() => { onPaymentSuccess(d); setDone(false); }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 shadow-2xl">
        {done ? (
          <div className="flex flex-col items-center py-12 px-6 text-center">
            <div className="bg-green-100 p-4 rounded-full mb-4"><CheckCircle className="w-14 h-14 text-green-600" /></div>
            <h3 className="text-2xl font-bold text-stone-900 mb-2">Payment submitted</h3>
            <p className="text-stone-600">Your certificate for <strong>{courseName}</strong> unlocks as soon as Finance confirms the payment.</p>
          </div>
        ) : (
          <div className="max-h-[90vh] overflow-y-auto">
            <DialogHeader className="p-6 pb-2 text-left">
              <DialogTitle className="text-2xl font-bold text-stone-900 flex items-center gap-2"><Award className="w-6 h-6 text-amber-600" />Certificate fee</DialogTitle>
              <DialogDescription>K {amount} for your {courseName} certificate.</DialogDescription>
            </DialogHeader>
            <div className="px-6 pb-6">
              <PayToAlphatech amount={amount} referenceHint={`CERT ${studentName}`} submitLabel={`Submit K ${amount} payment`} onSubmit={handle} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
