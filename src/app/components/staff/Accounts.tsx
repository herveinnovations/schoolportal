import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { useAuth, type StaffRole, type User } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { UserPlus, Mail, X, ShieldCheck, Power, Clock } from 'lucide-react';
import { EmptyState, StatusPill, fmtDate } from '../shell/ui';
import { Spinner } from '../AuthShell';

const ROLE_INFO: Record<'lecturer' | StaffRole, { label: string; text: string }> = {
  lecturer: { label: 'Lecturer', text: 'Teaches assigned courses: live classes, assignments, exams, marking and attendance.' },
  registrar: { label: 'Registrar', text: 'Students, courses, lecturers, results, certificates and announcements.' },
  finance: { label: 'Finance', text: 'Confirms or rejects payments and sees student balances.' },
  admin: { label: 'Administrator', text: 'Everything, including inviting people and switching accounts off.' },
};

type Choice = 'lecturer' | StaffRole;

/** Administrators invite lecturers and staff here and manage their access. */
export const Accounts: React.FC = () => {
  const { user, users, staffInvites, inviteStaff, cancelInvite, updateAccount } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; role: Choice }>({ name: '', email: '', role: 'lecturer' });
  const [busy, setBusy] = useState(false);
  const [confirmOff, setConfirmOff] = useState<User | null>(null);
  if (!user) return null;

  const team = users.filter(u => u.role !== 'student').sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role.localeCompare(b.role)));
  const waiting = staffInvites.filter(i => !i.acceptedAt);

  const send = async () => {
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email.trim())) { toast.error('Enter a name and a valid email'); return; }
    setBusy(true);
    const err = await inviteStaff({ name: form.name.trim(), email: form.email.trim(), role: form.role === 'lecturer' ? 'lecturer' : 'staff', staffRole: form.role === 'lecturer' ? undefined : form.role });
    setBusy(false);
    if (err) { toast.error(err); return; }
    toast.success(`Invitation sent to ${form.email.trim()}`, { description: 'They choose their own password from the email link.' });
    setForm({ name: '', email: '', role: 'lecturer' });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-stone-600 max-w-2xl">Lecturers and staff can’t sign up on their own. Invite them by email; they choose a password from the link and sign in on the same page as students.</p>
        <Button onClick={() => setOpen(true)}><UserPlus className="w-4 h-4" />Invite someone</Button>
      </div>

      {waiting.length > 0 && (
        <section className="bg-white rounded-2xl border border-stone-200 shadow-sm">
          <h3 className="px-5 pt-4 font-bold text-stone-900">Waiting to accept</h3>
          <ul className="divide-y divide-stone-100">
            <AnimatePresence initial={false}>
              {waiting.map(i => (
                <motion.li key={i.email} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <Mail className="w-4 h-4 text-stone-400" />
                  <span className="flex-1 min-w-[180px]"><span className="block text-sm font-medium text-stone-900">{i.name}</span><span className="block text-xs text-stone-500">{i.email} · invited {fmtDate(i.createdAt)}</span></span>
                  <StatusPill tone="amber"><Clock className="w-3 h-3" />{ROLE_INFO[i.role === 'lecturer' ? 'lecturer' : (i.staffRole ?? 'registrar')].label}</StatusPill>
                  <Button size="sm" variant="ghost" onClick={() => { cancelInvite(i.email); toast.success('Invitation cancelled'); }}><X className="w-4 h-4" />Cancel</Button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}

      {team.length === 0 ? <EmptyState icon={ShieldCheck} title="Only you so far" text="Invite your lecturers and office staff." /> : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[620px]">
            <thead className="bg-stone-50 text-stone-600"><tr>
              <th scope="col" className="text-left font-semibold px-4 py-3">Person</th>
              <th scope="col" className="text-left font-semibold px-3 py-3">Access</th>
              <th scope="col" className="text-left font-semibold px-3 py-3">Status</th>
              <th scope="col" className="text-right font-semibold px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr></thead>
            <tbody className="divide-y divide-stone-100">
              {team.map(p => {
                const me = p.id === user.id;
                return (
                  <tr key={p.id} className={p.active === false ? 'opacity-60' : ''}>
                    <td className="px-4 py-3"><p className="font-medium text-stone-900">{p.name}{me && <span className="text-stone-400 font-normal"> (you)</span>}</p><p className="text-xs text-stone-500">{p.email}</p></td>
                    <td className="px-3 py-3">
                      {p.role === 'lecturer' ? <StatusPill tone="amber">Lecturer</StatusPill> : me ? <StatusPill tone="emerald">{ROLE_INFO[p.staffRole ?? 'registrar'].label}</StatusPill> : (
                        <Select value={p.staffRole ?? 'registrar'} onValueChange={(v: StaffRole) => { updateAccount(p.id, { staffRole: v }); toast.success(`${p.name} is now ${ROLE_INFO[v].label}`); }}>
                          <SelectTrigger className="w-40 h-8" aria-label={`Access for ${p.name}`}><SelectValue /></SelectTrigger>
                          <SelectContent>{(['registrar', 'finance', 'admin'] as StaffRole[]).map(r => <SelectItem key={r} value={r}>{ROLE_INFO[r].label}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="px-3 py-3">{p.active === false ? <StatusPill tone="stone">Switched off</StatusPill> : <StatusPill tone="green">Active</StatusPill>}</td>
                    <td className="px-4 py-3 text-right">
                      {!me && (p.active === false
                        ? <Button size="sm" variant="outline" onClick={() => { updateAccount(p.id, { active: true }); toast.success(`${p.name} can sign in again`); }}><Power className="w-4 h-4" />Switch on</Button>
                        : <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setConfirmOff(p)}><Power className="w-4 h-4" />Switch off</Button>)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader className="text-left"><DialogTitle>Invite a lecturer or staff member</DialogTitle><DialogDescription>They get an email with a link to choose their password.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="inv-name">Full name</Label><Input id="inv-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mr. Joseph Banda" /></div>
            <div className="space-y-1.5"><Label htmlFor="inv-email">Email</Label><Input id="inv-email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" /></div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-stone-900 mb-1">What will they do?</legend>
              {(Object.keys(ROLE_INFO) as Choice[]).map(r => (
                <label key={r} className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${form.role === r ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500' : 'border-transparent bg-stone-100 hover:bg-stone-200'}`}>
                  <input type="radio" name="inv-role" className="mt-1 accent-emerald-700" checked={form.role === r} onChange={() => setForm({ ...form, role: r })} />
                  <span><span className="block text-sm font-semibold text-stone-900">{ROLE_INFO[r].label}</span><span className="block text-xs text-stone-600">{ROLE_INFO[r].text}</span></span>
                </label>
              ))}
            </fieldset>
            <p className="text-xs text-stone-500">Tip: if a course already lists this lecturer’s exact name, it is linked to them automatically when they accept.</p>
            <Button className="w-full" onClick={send} disabled={busy}>{busy ? <><Spinner /> Sending…</> : 'Send invitation'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmOff} onOpenChange={o => !o && setConfirmOff(null)}>
        <DialogContent>
          <DialogHeader className="text-left"><DialogTitle>Switch off {confirmOff?.name}’s account?</DialogTitle>
            <DialogDescription>They won’t be able to sign in. Their classes, marks and records stay, and you can switch the account back on at any time.</DialogDescription></DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOff(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (confirmOff) { updateAccount(confirmOff.id, { active: false }); toast.success(`${confirmOff.name} has been switched off`); } setConfirmOff(null); }}>Switch off</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
