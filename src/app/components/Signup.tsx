import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { SignupPaymentDialog } from './SignupPaymentDialog';
import { RegistrationForm } from './RegistrationForm';
import type { PaymentDetails } from './PayToAlphatech';
import { FEES } from '@/app/config/school';
import { AnimatePresence, motion } from 'motion/react';
import { AuthShell, ErrorNote, PasswordInput, Spinner, type Role } from './AuthShell';
import { MailCheck, Check, FileText, Wallet } from 'lucide-react';

interface SignupProps {
  onSwitchToLogin: (role?: Role) => void;
  onHome: () => void;
  initialRole?: Role;
}

/** Students create their own accounts. Lecturers and staff are invited by an administrator. */
export const Signup: React.FC<SignupProps> = ({ onSwitchToLogin, onHome }) => {
  const { user, signup, updateUser, submitPayment, logout } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const formDone = !!user?.personalDetails?.hasCompletedRegistration;

  const strength = (() => {
    let n = 0;
    if (password.length >= 6) n++;
    if (password.length >= 10) n++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) n++;
    if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) n++;
    return n;
  })();
  const strengthLabel = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-lime-500', 'bg-green-600'][strength];

  // A new student fills in the enrolment form first, then pays the admission form fee
  useEffect(() => {
    if (!user || user.role !== 'student' || user.hasCompletedPayment) return;
    if (!formDone) setShowForm(true); else setShowPaymentDialog(true);
  }, [user?.id, formDone]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !password) { setError('Fill in your name, email and password.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    if (password.length < 6) { setError('Use a password of at least 6 characters.'); return; }
    setLoading(true);
    const res = await signup(name, email, password);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    if (res.needsConfirmation) setCheckEmail(true);
  };

  const handlePaymentSuccess = (details: PaymentDetails) => {
    submitPayment({ purpose: 'registration', amount: FEES.registration, ...details });
    updateUser({ hasCompletedPayment: true });
    setShowPaymentDialog(false);
  };

  // Signed in but not finished: 1) enrolment form, 2) pay the admission form fee
  if (user && user.role === 'student' && !user.hasCompletedPayment) {
    const steps = [
      { icon: FileText, title: 'Fill in the enrolment form', text: 'Your details, mode of study and the courses you want.', done: formDone },
      { icon: Wallet, title: `Pay the K${FEES.registration} admission form fee`, text: 'By Mobile Money, bank or cash. Finance confirms it and issues your student number.', done: false },
    ];
    return (
      <AuthShell onHome={onHome} role="student">
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Welcome, {user.name.split(' ')[0]}</h1>
            <p className="text-sm text-stone-500 mt-1">Two steps to complete your application.</p>
          </div>
          <ol className="space-y-3">
            {steps.map((st, i) => {
              const current = !st.done && (i === 0 || steps[i - 1].done);
              return (
                <li key={st.title} className={`flex items-start gap-3 border p-4 ${current ? 'border-ink' : 'border-stone-200'} ${st.done ? 'bg-stone-50' : 'bg-white'}`}>
                  <span className={`w-9 h-9 shrink-0 flex items-center justify-center font-bold ${st.done ? 'bg-green-600 text-white' : current ? 'bg-sun text-ink' : 'bg-stone-100 text-stone-400'}`}>{st.done ? <Check className="w-5 h-5" /> : i + 1}</span>
                  <span className="flex-1">
                    <span className={`block font-semibold ${st.done ? 'text-stone-500 line-through' : 'text-ink'}`}>{st.title}</span>
                    <span className="block text-sm text-stone-500">{st.text}</span>
                  </span>
                </li>
              );
            })}
          </ol>
          {!formDone
            ? <Button onClick={() => setShowForm(true)} className="w-full h-11"><FileText className="w-4 h-4" />Fill in the enrolment form</Button>
            : <Button onClick={() => setShowPaymentDialog(true)} className="w-full h-11"><Wallet className="w-4 h-4" />Pay the K{FEES.registration} admission form fee</Button>}
          {formDone && <button onClick={() => setShowForm(true)} className="w-full text-sm text-royal hover:underline">Review or change my enrolment form</button>}
          <button onClick={logout} className="w-full text-sm text-stone-500 hover:text-stone-800">Sign out</button>
        </div>
        <RegistrationForm open={showForm} onOpenChange={setShowForm} onComplete={() => setShowPaymentDialog(true)} />
        <SignupPaymentDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog} studentName={user.name} onPaymentSuccess={handlePaymentSuccess} />
      </AuthShell>
    );
  }

  if (checkEmail) {
    return (
      <AuthShell onHome={onHome} role="student">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
          <span className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><MailCheck className="w-7 h-7" /></span>
          <h1 className="text-2xl font-bold text-stone-900">Check your email</h1>
          <p className="text-sm text-stone-600">We sent a confirmation link to <strong>{email}</strong>. Open it on this device to activate your account, then fill in the enrolment form.</p>
          <p className="text-xs text-stone-500">No email after a few minutes? Check your spam folder.</p>
          <Button variant="outline" className="w-full" onClick={() => onSwitchToLogin('student')}>Go to sign in</Button>
        </motion.div>
      </AuthShell>
    );
  }

  return (
    <AuthShell onHome={onHome} role="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Create your student account</h1>
          <p className="text-stone-500 text-sm mt-1">After sign-up you fill in the enrolment form and pay the K{FEES.registration} admission form fee by Mobile Money, bank or cash.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" type="text" autoComplete="name" placeholder="e.g. Chanda Mwila" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput id="password" autoComplete="new-password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
            {password && (
              <div className="flex items-center gap-2 pt-1" aria-live="polite">
                <div className="flex-1 grid grid-cols-4 gap-1">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="h-1.5 rounded-full bg-stone-200 overflow-hidden">
                      <motion.div className={`h-full ${strengthColor}`} initial={false} animate={{ width: i < strength ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
                    </div>
                  ))}
                </div>
                <span className="text-xs text-stone-500 w-16 text-right">{strengthLabel}</span>
              </div>
            )}
          </div>
          <AnimatePresence>{error && <ErrorNote key={error}>{error}</ErrorNote>}</AnimatePresence>
          <Button type="submit" className="w-full h-11" disabled={loading}>{loading ? <><Spinner /> Creating account…</> : 'Create account'}</Button>
        </form>
        <p className="text-center text-sm text-stone-600">
          Already have an account?{' '}
          <button type="button" onClick={() => onSwitchToLogin('student')} className="text-emerald-700 font-medium hover:underline">Sign in</button>
        </p>
        <p className="text-center text-xs text-stone-500">Lecturers and staff don’t sign up here. Administration sends you an email invitation.</p>
      </div>
    </AuthShell>
  );
};
