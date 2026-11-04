import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { AuthShell, ErrorNote, SuccessNote, PasswordInput, Spinner } from './AuthShell';
import { ShieldCheck } from 'lucide-react';

/** Formats what's typed into the ATC-XXXX-XXXX shape. */
const formatId = (v: string) => {
  const raw = v.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^ATC/, '').slice(0, 8);
  return raw ? `ATC-${raw.slice(0, 4)}${raw.length > 4 ? '-' + raw.slice(4) : ''}` : '';
};

/**
 * Sign-in for lecturers and staff only, at /staff.
 * Needs email, password and the Staff ID the school gave them. Students are turned away.
 * In "id only" mode (already signed in, e.g. from an invitation) it just asks for the Staff ID.
 */
export const StaffLogin: React.FC<{ onHome: () => void }> = ({ onHome }) => {
  const { user, loginStaff, verifyStaffId, logout, requestPasswordReset } = useAuth();
  const idOnly = !!user;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staffId, setStaffId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!idOnly && (!email.trim() || !password)) { setError('Enter your email and password.'); return; }
    if (!/^ATC-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(staffId)) { setError('Enter your full Staff ID, for example ATC-7K4P-92QX.'); return; }
    setBusy(true);
    const err = idOnly ? await verifyStaffId(staffId) : await loginStaff(email, password, staffId);
    setBusy(false);
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
    <AuthShell onHome={onHome} role="staff"
      aside={<p className="mt-4 text-xs text-stone-500 text-center px-4">Lost your Staff ID? Ask the administrator. It is never sent by email.</p>}>
      <div className="space-y-6">
        <div>
          <span className="inline-flex items-center gap-1.5 bg-ink text-white text-[11px] font-bold uppercase tracking-[0.12em] px-2.5 py-1"><ShieldCheck className="w-3.5 h-3.5 text-sun" />Staff only</span>
          <h1 className="mt-4 text-2xl font-bold text-stone-900">{idOnly ? 'Enter your Staff ID' : 'Lecturer & staff sign in'}</h1>
          <p className="text-stone-500 text-sm mt-1">
            {idOnly ? <>Signed in as <strong>{user?.email}</strong>. Enter the Staff ID the school gave you to open your portal.</>
              : 'For lecturers and staff of Alphatech Computer Institute. You need your email, password and Staff ID.'}
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4" noValidate>
          {!idOnly && <>
            <div className="space-y-2">
              <Label htmlFor="s-email">Email</Label>
              <Input id="s-email" type="email" autoComplete="username" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="s-password">Password</Label>
                <button type="button" onClick={() => { setShowReset(true); setResetEmail(email); setResetSent(false); setResetError(''); }} className="text-xs text-royal hover:underline">Forgot password?</button>
              </div>
              <PasswordInput id="s-password" autoComplete="current-password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </>}
          <div className="space-y-2">
            <Label htmlFor="s-id">Staff ID</Label>
            <Input id="s-id" autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="ATC-XXXX-XXXX" value={staffId}
              onChange={e => setStaffId(formatId(e.target.value))} className="font-mono tracking-[0.12em] uppercase" />
          </div>
          <AnimatePresence>{error && <ErrorNote key={error}>{error}</ErrorNote>}</AnimatePresence>
          <Button type="submit" className="w-full h-11" disabled={busy}>
            {busy ? <><Spinner /> Checking…</> : idOnly ? 'Open my portal' : 'Sign In'}
          </Button>
        </form>
        {idOnly && <button type="button" onClick={logout} className="w-full text-sm text-stone-500 hover:text-stone-800">Sign out</button>}
      </div>

      <Dialog open={showReset} onOpenChange={setShowReset}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="text-left">
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>We’ll email you a link to choose a new password. Your Staff ID stays the same.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input aria-label="Email" type="email" placeholder="you@example.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
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
