import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { AuthShell, ErrorNote, PasswordInput, Spinner } from './AuthShell';

/** Shown after someone opens an invitation or password-reset email. */
export const SetPassword: React.FC<{ mode: 'invite' | 'recovery'; onHome: () => void }> = ({ mode, onHome }) => {
  const { user, setNewPassword } = useAuth();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (pw.length < 8) { setError('Use at least 8 characters.'); return; }
    if (pw !== confirm) { setError('The two passwords don’t match.'); return; }
    setBusy(true);
    const err = await setNewPassword(pw);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <AuthShell onHome={onHome} role={user?.role ?? 'all'}>
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{mode === 'invite' ? `Welcome${user ? `, ${user.name.split(' ')[0]}` : ''}` : 'Choose a new password'}</h1>
          <p className="text-stone-500 text-sm mt-1">
            {mode === 'invite'
              ? `You’ve been invited to Alphatech Computer Institute${user ? ` as ${user.role === 'staff' ? `staff (${user.staffRole ?? 'registrar'})` : 'a lecturer'}` : ''}. Choose a password to finish setting up your account.`
              : 'Pick a password you haven’t used before.'}
          </p>
        </div>
        <div className="space-y-2"><Label htmlFor="np">New password</Label><PasswordInput id="np" autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} placeholder="At least 8 characters" /></div>
        <div className="space-y-2"><Label htmlFor="np2">Type it again</Label><PasswordInput id="np2" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} /></div>
        <AnimatePresence>{error && <ErrorNote key={error}>{error}</ErrorNote>}</AnimatePresence>
        <Button type="submit" className="w-full h-11" disabled={busy}>{busy ? <><Spinner /> Saving…</> : 'Save password and continue'}</Button>
      </form>
    </AuthShell>
  );
};
