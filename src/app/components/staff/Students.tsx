import React, { useState } from 'react';
import { useAuth, type User } from '@/app/context/AuthContext';
import { Input } from '@/app/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Search, Users, Download } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { EmptyState, Segmented, StatusPill, fmtDate } from '../shell/ui';
import { kwacha, planLabel, studentFinance } from '@/app/lib/finance';
import { courseMark, letter } from '@/app/lib/academics';

type Filter = 'all' | 'overdue' | 'unregistered' | 'clear';

export const Students: React.FC = () => {
  const { users, courses, paymentClaims, homeworks, homeworkSubmissions, exams, examAttempts, attendance } = useAuth();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<User | null>(null);

  const rows = users.filter(u => u.role === 'student').map(s => ({ s, f: studentFinance(s, paymentClaims) }))
    .filter(({ s, f }) => filter === 'all' || (filter === 'overdue' ? f.overdue.length > 0 : filter === 'unregistered' ? !s.studentNumber : f.balance === 0 && !!s.studentNumber))
    .filter(({ s }) => !q.trim() || `${s.name} ${s.email} ${s.studentNumber ?? ''} ${s.personalDetails?.nrcNumber ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => a.s.name.localeCompare(b.s.name));

  const status = (s: User, f: ReturnType<typeof studentFinance>) => {
    if (!s.studentNumber) return f.registration?.status === 'pending' ? <StatusPill tone="amber">Registration fee to confirm</StatusPill> : <StatusPill tone="stone">Not registered</StatusPill>;
    if (f.overdue.length) return <StatusPill tone="red">Overdue</StatusPill>;
    if (f.balance > 0) return <StatusPill tone="emerald">Paying</StatusPill>;
    return <StatusPill tone="green">Paid up</StatusPill>;
  };

  const exportCsv = () => {
    const head = ['Name', 'Student no.', 'Email', 'Phone', 'Mode of study', 'Courses ticked on form', 'Enrolled courses', 'Fees', 'Paid', 'Balance', 'Overdue instalments'];
    const data = rows.map(({ s, f }) => [s.name, s.studentNumber ?? '', s.email, s.personalDetails?.phoneNumber ?? '', s.personalDetails?.modeOfStudy ?? '', (s.personalDetails?.coursesOfInterest ?? []).join('; '), s.courses.map(id => courses.find(c => c.id === id)?.name ?? '').join('; '), f.totalFees, f.paidFees, f.balance, f.overdue.length]);
    const csv = [head, ...data].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'Alphatech students.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const sel = open ? { s: open, f: studentFinance(open, paymentClaims) } : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented id="st-filter" value={filter} onChange={setFilter} options={[['all', 'All'], ['overdue', 'Overdue'], ['unregistered', 'Not registered'], ['clear', 'Paid up']]} />
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <Input aria-label="Search students" className="pl-9" placeholder="Name, number, email or NRC" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <Button variant="outline" onClick={exportCsv} disabled={!rows.length} aria-label="Export to CSV"><Download className="w-4 h-4" /><span className="hidden sm:inline">Export</span></Button>
        </div>
      </div>

      {rows.length === 0 ? <EmptyState icon={Users} title="No students match" text="Try a different search or filter." /> : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-stone-50 text-stone-600"><tr>
              <th scope="col" className="text-left font-semibold px-4 py-3">Student</th>
              <th scope="col" className="text-left font-semibold px-3 py-3">Courses</th>
              <th scope="col" className="text-right font-semibold px-3 py-3">Paid</th>
              <th scope="col" className="text-right font-semibold px-3 py-3">Balance</th>
              <th scope="col" className="text-left font-semibold px-4 py-3">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map(({ s, f }) => (
                <tr key={s.id} className="hover:bg-stone-50/70 cursor-pointer" onClick={() => setOpen(s)}>
                  <td className="px-4 py-3"><button className="text-left" onClick={() => setOpen(s)}><span className="block font-medium text-stone-900">{s.name}</span><span className="block text-xs text-stone-400">{s.studentNumber ?? s.email}</span></button></td>
                  <td className="px-3 py-3 text-stone-600">{s.courses.length || '—'}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{kwacha(f.paidFees)}</td>
                  <td className={`px-3 py-3 text-right tabular-nums font-semibold ${f.overdue.length ? 'text-red-600' : 'text-stone-900'}`}>{kwacha(f.balance)}</td>
                  <td className="px-4 py-3">{status(s, f)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!sel} onOpenChange={o => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {sel && (
            <>
              <DialogHeader className="text-left">
                <DialogTitle>{sel.s.name}</DialogTitle>
                <DialogDescription>{sel.s.studentNumber ?? 'No student number yet'} · {sel.s.email}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[['Fees', kwacha(sel.f.totalFees)], ['Paid', kwacha(sel.f.paidFees)], ['Balance', kwacha(sel.f.balance)]].map(([l, v]) => (
                  <div key={l} className="rounded-xl bg-stone-50 py-3"><p className="text-xs text-stone-500">{l}</p><p className="font-bold text-stone-900 tabular-nums">{v}</p></div>
                ))}
              </div>
              <div>
                <h4 className="font-semibold text-stone-900 text-sm mb-2">Courses</h4>
                {(sel.s.enrollments ?? []).length === 0 ? <p className="text-sm text-stone-500">Not enrolled in any course.</p> : (
                  <ul className="space-y-2">
                    {(sel.s.enrollments ?? []).map(e => {
                      const c = courses.find(x => x.id === e.courseId);
                      const m = courseMark(e.courseId, sel.s.id, homeworks, homeworkSubmissions, exams, examAttempts);
                      const att = attendance.filter(a => a.studentId === sel.s.id && a.courseId === e.courseId).length;
                      return (
                        <li key={e.courseId} className="rounded-xl border border-stone-200 p-3 flex flex-wrap items-center gap-3 text-sm">
                          <span className="flex-1 min-w-[160px]"><span className="block font-medium text-stone-900">{c?.name ?? 'Removed course'}</span><span className="block text-xs text-stone-500">{e.type === 'full-time' ? 'Full-time' : 'Part-time'} · {planLabel(e.paymentPlan)} · {kwacha(e.amountPaid)} of {kwacha(e.totalAmount)}</span></span>
                          <StatusPill tone="stone">{att} classes</StatusPill>
                          {m !== undefined ? <StatusPill tone={m >= 50 ? 'green' : 'red'}>{m}% · {letter(m)}</StatusPill> : <StatusPill tone="stone">No marks yet</StatusPill>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              {sel.s.personalDetails && (
                <div>
                  <h4 className="font-semibold text-stone-900 text-sm mb-2">Enrolment form</h4>
                  {(() => {
                    const p = sel.s.personalDetails!;
                    const rows: [string, React.ReactNode][] = [
                      ['Date of birth', p.dateOfBirth && fmtDate(p.dateOfBirth)], ['Gender', p.gender], ['N.R.C number', p.nrcNumber],
                      ['Cell number', p.phoneNumber], ['Residential address', p.residentialAddress || p.address], ['Mode of study', p.modeOfStudy],
                      ['Physical disabilities', p.disability === 'Yes' && p.disabilityDetails ? `Yes: ${p.disabilityDetails}` : p.disability],
                      ['Academic qualification', p.academicQualification],
                      ['Guardian', [p.guardianName, p.guardianPhone].filter(Boolean).join(' · ')],
                    ];
                    return (
                      <>
                        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          {rows.filter(([, v]) => v).map(([k, v]) => (
                            <div key={k}><dt className="text-xs text-stone-500">{k}</dt><dd className="text-stone-900">{v}</dd></div>
                          ))}
                        </dl>
                        {!!p.coursesOfInterest?.length && (
                          <div className="mt-3">
                            <p className="text-xs text-stone-500 mb-1.5">Courses ticked on the form</p>
                            <div className="flex flex-wrap gap-1.5">{p.coursesOfInterest.map(c => <span key={c} className="bg-sun/20 border border-sun px-2 py-0.5 text-xs text-ink">{c}</span>)}</div>
                          </div>
                        )}
                        {p.message && <div className="mt-3"><p className="text-xs text-stone-500">Message</p><p className="text-sm text-stone-800 whitespace-pre-line">{p.message}</p></div>}
                      </>
                    );
                  })()}
                </div>
              )}
              <div>
                <h4 className="font-semibold text-stone-900 text-sm mb-2">Payments</h4>
                {sel.f.claims.length === 0 ? <p className="text-sm text-stone-500">No payments submitted.</p> : (
                  <ul className="divide-y divide-stone-100 text-sm">
                    {[...sel.f.claims].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).map(c => (
                      <li key={c.id} className="flex items-center gap-3 py-2">
                        <span className="flex-1 min-w-0 truncate">{c.purpose === 'registration' ? 'Registration fee' : c.purpose === 'certificate' ? 'Certificate fee' : `Course fee · ${c.courseName}`}<span className="text-xs text-stone-400"> · {fmtDate(c.submittedAt)}</span></span>
                        <span className="tabular-nums">{kwacha(c.amount)}</span>
                        <StatusPill tone={c.status === 'confirmed' ? 'green' : c.status === 'pending' ? 'amber' : 'red'}>{c.status === 'pending' ? 'To check' : c.status === 'confirmed' ? 'Confirmed' : 'Rejected'}</StatusPill>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
