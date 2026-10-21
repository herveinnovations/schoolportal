import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { AuthShell, ErrorNote, SuccessNote, PasswordInput, Spinner, type Role } from './AuthShell';
import { Info } from 'lucide-react';

interface LoginProps {
  onSwitchToSignup: (role?: Role) => void;
  onHome: () => void;
  initialRole?: Role;
}

/** One sign-in for everyone. The account decides which portal opens. */
export const Login: React.FC<LoginProps> = ({ onSwitchToSignup, onHome }) => {
  const { login, requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    setLoading(true);
    const err = await login(email, password);
    setLoading(false);
    if (err) setError(err);
  };

  const handleReset = async () => {
    setResetError('');
    if (!/^\S+@\S+\.\S+$/.test(resetEmail.trim())) { setResetError('Enter the email address you sign in with.'); return; }
    setResetBusy(true);
    const err = await requestPasswordReset(resetEmail);
    setResetBusy(false);
    if (err) setResetError(err); else setResetSent(true);
  };

  return (
    <AuthShell
      onHome={onHome}
      role="all"
      aside={
        <p className="mt-4 text-xs text-stone-500 flex items-start justify-center gap-1.5 text-center px-4">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Lecturers and staff: use the email your invitation was sent to.
        </p>
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Welcome back</h1>
          <p className="text-stone-500 text-sm mt-1">Sign in to Alphatech Computer Institute. Students, lecturers and staff all sign in here.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button type="button" onClick={() => { setShowReset(true); setResetEmail(email); setResetSent(false); setResetError(''); }} className="text-xs text-emerald-700 hover:underline">Forgot password?</button>
            </div>
            <PasswordInput id="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <AnimatePresence>{error && <ErrorNote key={error}>{error}</ErrorNote>}</AnimatePresence>
          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? <><Spinner /> Signing in…</> : 'Sign In'}
          </Button>
        </form>
        <p className="text-center text-sm text-stone-600">
          New student?{' '}
          <button type="button" onClick={() => onSwitchToSignup('student')} className="text-emerald-700 font-medium hover:underline">Create your account</button>
        </p>
      </div>

      <Dialog open={showReset} onOpenChange={setShowReset}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="text-left">
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>We’ll email you a link to choose a new password.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input aria-label="Email" type="email" placeholder="you@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
            {resetError && <ErrorNote>{resetError}</ErrorNote>}
            {resetSent && <SuccessNote>If an account uses {resetEmail}, a reset link is on its way. Check your inbox and spam folder.</SuccessNote>}
          </div>
          <DialogFooter>
            <Button type="button" className="w-full" disabled={resetBusy || resetSent} onClick={handleReset}>{resetBusy ? <><Spinner /> Sending…</> : 'Send reset link'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthShell>
  );
};
