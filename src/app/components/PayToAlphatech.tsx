import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Smartphone, Building, Banknote, Copy, Check, Clock, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Button } from '@/app/components/ui/button';
import { PAY_TO, CONFIRM_TIME } from '@/app/config/school';
import type { PaymentMethod } from '@/app/context/AuthContext';

export interface PaymentDetails { method: PaymentMethod; reference: string; payerPhone?: string; note?: string }

const methods: { id: PaymentMethod; label: string; icon: React.ReactNode; tone: string }[] = [
  { id: 'mtn', label: 'MTN Money', icon: <Smartphone className="w-5 h-5" />, tone: 'bg-yellow-100 text-yellow-800' },
  { id: 'airtel', label: 'Airtel Money', icon: <Smartphone className="w-5 h-5" />, tone: 'bg-red-100 text-red-700' },
  { id: 'bank', label: 'Bank transfer', icon: <Building className="w-5 h-5" />, tone: 'bg-emerald-100 text-emerald-800' },
  { id: 'cash', label: 'Cash at office', icon: <Banknote className="w-5 h-5" />, tone: 'bg-stone-100 text-stone-700' },
];

const CopyValue: React.FC<{ value: string }> = ({ value }) => {
  const [copied, setCopied] = useState(false);
  return (
    <span className="inline-flex items-center gap-1.5">
      <strong className="font-semibold tabular-nums select-all">{value}</strong>
      <button type="button" aria-label={`Copy ${value}`} className="p-1 rounded hover:bg-black/5 text-stone-500"
        onClick={() => {
          navigator.clipboard?.writeText(value.replace(/\s/g, '')).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => toast.info('Select the number to copy it'));
        }}>
        {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </span>
  );
};

interface Props {
  amount: number;
  referenceHint: string; // what the student should write as the payment reference
  submitLabel?: string;
  busy?: boolean;
  onSubmit: (d: PaymentDetails) => void;
}

/** Shows Alphatech's payment details, then collects the transaction reference so Finance can confirm it. */
export const PayToAlphatech: React.FC<Props> = ({ amount, referenceHint, submitLabel = 'Submit payment', busy, onSubmit }) => {
  const [method, setMethod] = useState<PaymentMethod>('mtn');
  const [reference, setReference] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (method !== 'cash' && reference.trim().length < 4) { setError('Enter the transaction ID from your payment SMS or bank slip.'); return; }
    if (method === 'cash' && reference.trim().length < 2) { setError('Enter the receipt number the office gave you.'); return; }
    setError('');
    onSubmit({ method, reference: reference.trim(), payerPhone: payerPhone.trim() || undefined, note: note.trim() || undefined });
  };

  return (
    <div className="space-y-5">
      <div>
        <Label className="mb-2 block text-stone-700">1. Choose how you'll pay</Label>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Payment method">
          {methods.map(m => (
            <button key={m.id} type="button" role="radio" aria-checked={method === m.id} onClick={() => { setMethod(m.id); setError(''); }}
              className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left text-sm font-medium transition ${method === m.id ? 'border-emerald-600 bg-emerald-50/60' : 'border-stone-200 hover:border-stone-300 bg-white'}`}>
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${m.tone}`}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block text-stone-700">2. Send the payment</Label>
        <AnimatePresence mode="wait">
          <motion.div key={method} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
            className="rounded-xl bg-stone-50 border border-stone-200 p-4 text-sm text-stone-700 space-y-1.5">
            <p>Amount: <strong className="text-stone-900 tabular-nums">K {amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></p>
            {(method === 'mtn' || method === 'airtel') && (
              <>
                <p>Send to {PAY_TO[method].label}: <CopyValue value={PAY_TO[method].number} /> ({PAY_TO[method].name})</p>
                <p>Reference: <strong>{referenceHint}</strong></p>
                <p className="text-xs text-stone-500 pt-1">You'll receive an SMS with a transaction ID. You need it in the next step.</p>
              </>
            )}
            {method === 'bank' && (
              <>
                <p>{PAY_TO.bank.bank}, {PAY_TO.bank.branch} branch</p>
                <p>Account name: <strong>{PAY_TO.bank.name}</strong></p>
                <p>Account number: <CopyValue value={PAY_TO.bank.account} /></p>
                <p>Reference: <strong>{referenceHint}</strong></p>
              </>
            )}
            {method === 'cash' && (
              <>
                <p>Pay at the {PAY_TO.cash.where}, {PAY_TO.cash.hours}.</p>
                <p className="text-xs text-stone-500 pt-1">Ask for a receipt and enter its number below.</p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="space-y-3">
        <Label className="block text-stone-700">3. Tell us how you paid</Label>
        <div className="space-y-1.5">
          <Label htmlFor="pay-ref" className="text-sm font-normal text-stone-600">{method === 'cash' ? 'Receipt number' : 'Transaction ID'}</Label>
          <Input id="pay-ref" value={reference} onChange={e => setReference(e.target.value)} placeholder={method === 'bank' ? 'e.g. FT2610160931' : method === 'cash' ? 'e.g. R-00482' : 'e.g. MP261016.0931.C88340'} />
        </div>
        {(method === 'mtn' || method === 'airtel') && (
          <div className="space-y-1.5">
            <Label htmlFor="pay-phone" className="text-sm font-normal text-stone-600">Number you paid from (optional)</Label>
            <Input id="pay-phone" inputMode="tel" value={payerPhone} onChange={e => setPayerPhone(e.target.value)} placeholder="e.g. 0966 210 774" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="pay-note" className="text-sm font-normal text-stone-600">Note for Finance (optional)</Label>
          <Textarea id="pay-note" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Paid by my guardian" />
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="flex items-start gap-2 text-xs text-stone-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
        <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <span>Finance checks your payment against the account statement and confirms it, {CONFIRM_TIME}. You'll get a notification when it's confirmed.</span>
      </div>

      <Button type="button" className="w-full h-11" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : submitLabel}</Button>
      <p className="text-[11px] text-stone-400 flex items-center justify-center gap-1"><Info className="w-3 h-3" />Never share your Mobile Money PIN with anyone, including Alphatech staff.</p>
    </div>
  );
};
