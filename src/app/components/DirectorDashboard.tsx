import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAuth, staffCan, type Course, type Announcement } from '@/app/context/AuthContext';
import { Accounts } from './staff/Accounts';
import { WebsiteEditor } from './staff/WebsiteEditor';
import { Files } from './staff/Files';
import { uploadSiteImage } from '@/app/lib/media';
import { Spinner } from './AuthShell';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Tabs, TabsContent } from '@/app/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { LayoutDashboard, Wallet, Users, UserSquare2, KeyRound, Globe, FolderOpen, BookOpen, GraduationCap, Megaphone, Award, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { DashboardShell, type NavItem } from './shell/DashboardShell';
import { NotificationBell } from './shell/NotificationBell';
import { SectionTitle, EmptyState, StatusPill, Segmented, fmtDate } from './shell/ui';
import { StaffOverview } from './staff/StaffOverview';
import { Payments } from './staff/Payments';
import { Students } from './staff/Students';
import { courseMark, letter, letterTone } from '@/app/lib/academics';
import { kwacha } from '@/app/lib/finance';
import { FEES } from '@/app/config/school';

const emptyCourse = { name: '', description: '', credits: 3, price: 0, lecturerId: '', level: 'beginner' as NonNullable<Course['level']>, imageUrl: '' };
const levelLabel: Record<NonNullable<Course['level']>, string> = { beginner: 'Beginner', advanced: 'Advanced', teveta_level_3: 'TEVETA Level 3' };

export const DirectorDashboard: React.FC = () => {
  const {
    user, logout, users, courses, paymentClaims, homeworks, homeworkSubmissions, exams, examAttempts, liveClasses, announcements,
    addCourse, updateCourse, deleteCourse, addCertificate, addAnnouncement, deleteAnnouncement,
  } = useAuth();
  const [tab, setTab] = useState('overview');
  const [courseDialog, setCourseDialog] = useState<null | 'new' | string>(null);
  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [confirmDelete, setConfirmDelete] = useState<Course | null>(null);
  const [annOpen, setAnnOpen] = useState(false);
  const [ann, setAnn] = useState<{ title: string; content: string; type: Announcement['type']; audience: Announcement['audience']; courseId: string }>({ title: '', content: '', type: 'general', audience: 'all', courseId: '' });
  const [certOpen, setCertOpen] = useState(false);
  const [cert, setCert] = useState({ studentId: '', courseId: '', title: 'Certificate of Completion', fileUrl: '' });
  const [resultsCourse, setResultsCourse] = useState('');
  const [lecQ, setLecQ] = useState('');
  const [imgBusy, setImgBusy] = useState(false);

  if (!user) return null;
  const students = users.filter(u => u.role === 'student');
  const lecturers = users.filter(u => u.role === 'lecturer');
  const pendingCount = paymentClaims.filter(c => c.status === 'pending').length;

  const allItems: (NavItem & { area: Parameters<typeof staffCan>[1] | 'any' })[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, area: 'any' },
    { id: 'payments', label: 'Payments', icon: Wallet, badge: pendingCount, area: 'payments' },
    { id: 'students', label: 'Students', icon: Users, section: 'People', area: 'people' },
    { id: 'lecturers', label: 'Lecturers', icon: UserSquare2, section: 'People', area: 'academics' },
    { id: 'courses', label: 'Courses', icon: BookOpen, section: 'Academics', area: 'academics' },
    { id: 'results', label: 'Results', icon: GraduationCap, section: 'Academics', area: 'academics' },
    { id: 'certificates', label: 'Certificates', icon: Award, section: 'Academics', area: 'academics' },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, section: 'Communication', area: 'academics' },
    { id: 'files', label: 'Files', icon: FolderOpen, section: 'Communication', area: 'academics' },
    { id: 'website', label: 'Website', icon: Globe, section: 'Communication', area: 'academics' },
    { id: 'accounts', label: 'Staff & access', icon: KeyRound, section: 'Administration', area: 'accounts' },
  ];
  const items: NavItem[] = allItems.filter(i => i.area === 'any' || staffCan(user, i.area));
  const allowed = new Set(items.map(i => i.id));
  const go = (id: string) => { if (allowed.has(id)) setTab(id); };
  const primary = ['overview', 'payments', 'students', 'results', 'courses', 'website'].filter(id => allowed.has(id)).slice(0, 4);


  const openCourse = (c?: Course) => {
    setCourseForm(c ? { name: c.name, description: c.description, credits: c.credits, price: c.price, lecturerId: c.lecturerId, level: c.level ?? 'beginner', imageUrl: c.imageUrl ?? '' } : emptyCourse);
    setCourseDialog(c ? c.id : 'new');
  };
  const saveCourse = () => {
    if (!courseForm.name.trim() || !courseForm.description.trim()) return toast.error('Add a course name and description');
    if (!(courseForm.price >= 0)) return toast.error('Enter a fee of 0 or more');
    const lec = lecturers.find(l => l.id === courseForm.lecturerId);
    const data = { name: courseForm.name.trim(), description: courseForm.description.trim(), credits: courseForm.credits || 0, price: courseForm.price || 0, currency: 'ZMW', lecturerId: lec?.id ?? '', lecturerName: lec?.name ?? 'To be assigned', level: courseForm.level, imageUrl: courseForm.imageUrl || undefined };
    if (courseDialog && courseDialog !== 'new') { updateCourse(courseDialog, data); toast.success('Course updated'); }
    else { addCourse(data); toast.success('Course created', { description: lec ? `${lec.name} can now teach it.` : 'Assign a lecturer when one is ready.' }); }
    setCourseDialog(null);
  };

  const rCourse = courses.find(c => c.id === resultsCourse) ?? courses[0];

  return (
    <DashboardShell portal="Staff" user={user} items={items} active={tab} onNavigate={go} primary={primary} onLogout={logout} subtitle={user.staffRole === 'admin' ? 'Administrator' : user.staffRole === 'finance' ? 'Finance' : 'Registrar'}
      actions={<NotificationBell onOpen={() => {}} />}>
      <Tabs value={tab} onValueChange={go}>
        <TabsContent value="overview"><StaffOverview go={go} /></TabsContent>

        <TabsContent value="website">
          <SectionTitle title="Website" sub="Change the photos and text on the public website. Changes go live straight away." />
          {staffCan(user, 'academics') && <WebsiteEditor />}
        </TabsContent>

        <TabsContent value="files">
          <SectionTitle title="Files" sub="Upload documents and choose who can download them: the public website, students, lecturers or one course." />
          {staffCan(user, 'academics') && <Files />}
        </TabsContent>

        <TabsContent value="accounts">
          <SectionTitle title="Staff & access" sub="Invite lecturers and office staff, choose what they can manage, and switch accounts off when someone leaves." />
          {staffCan(user, 'accounts') && <Accounts />}
        </TabsContent>

        <TabsContent value="payments">
          {staffCan(user, 'payments') && <>
          <SectionTitle title="Payments" sub="Students pay by mobile money, bank or cash and send you the reference. Confirm once you see it on your statement." />
          <Payments />
          </>}
        </TabsContent>

        <TabsContent value="students">
          <SectionTitle title="Students" sub={`${students.length} registered. Select a student to see their courses, marks and payments.`} />
          <Students />
        </TabsContent>

        {/* Lecturers */}
        <TabsContent value="lecturers">
          <SectionTitle title="Lecturers" sub="Teaching load, classes held and marking backlog." action={
            <div className="relative w-full sm:w-56"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" /><Input aria-label="Search lecturers" className="pl-9" placeholder="Search" value={lecQ} onChange={e => setLecQ(e.target.value)} /></div>
          } />
          {lecturers.length === 0 ? <EmptyState icon={UserSquare2} title="No lecturers yet" text="Lecturers appear here once they sign up with a lecturer account." /> : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {lecturers.filter(l => !lecQ.trim() || l.name.toLowerCase().includes(lecQ.trim().toLowerCase())).map(l => {
                const mine = courses.filter(c => c.lecturerId === l.id);
                const held = liveClasses.filter(c => c.lecturerId === l.id && new Date(c.scheduledTime) <= new Date()).length;
                const myHw = homeworks.filter(h => h.lecturerId === l.id).map(h => h.id);
                const myEx = exams.filter(e => e.lecturerId === l.id).map(e => e.id);
                const backlog = homeworkSubmissions.filter(s => myHw.includes(s.homeworkId) && s.grade === undefined).length + examAttempts.filter(a => a.needsMarking && myEx.includes(a.examId)).length;
                const nStudents = students.filter(s => s.courses.some(c => mine.some(m => m.id === c))).length;
                return (
                  <div key={l.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12"><AvatarImage src={l.profilePicture} /><AvatarFallback className="bg-amber-100 text-amber-800 font-bold">{l.name.replace(/^(Mr|Ms|Mrs|Dr)\.?\s/, '')[0]}</AvatarFallback></Avatar>
                      <div className="min-w-0"><p className="font-semibold text-stone-900 truncate">{l.name}</p><p className="text-xs text-stone-500 truncate">{l.email}</p></div>
                    </div>
                    <p className="mt-3 text-sm text-stone-600 line-clamp-2 min-h-[2.5rem]">{mine.map(c => c.name).join(', ') || 'No courses assigned'}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      {[[nStudents, 'Students'], [held, 'Classes held'], [backlog, 'To mark']].map(([v, k]) => (
                        <div key={k as string} className={`rounded-xl py-2 ${k === 'To mark' && (v as number) > 0 ? 'bg-amber-50' : 'bg-stone-50'}`}><p className="text-lg font-bold text-stone-900 tabular-nums">{v}</p><p className="text-[11px] text-stone-500">{k}</p></div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Courses */}
        <TabsContent value="courses">
          <SectionTitle title="Courses" sub={`Registration fee is ${kwacha(FEES.registration)}. Course fees are set per course.`} action={<Button onClick={() => openCourse()}><Plus className="w-4 h-4" />New course</Button>} />
          {courses.length === 0 ? <EmptyState icon={BookOpen} title="No courses yet" text="Create your first course and assign a lecturer." action={<Button onClick={() => openCourse()}>New course</Button>} /> : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {courses.map(c => {
                const n = students.filter(s => s.courses.includes(c.id)).length;
                return (
                  <div key={c.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
                    {c.imageUrl ? <img src={c.imageUrl} alt="" className="h-32 w-full object-cover" /> : <div className="h-2 bg-gradient-to-r from-emerald-600 to-teal-600" />}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2"><h3 className="font-bold text-stone-900">{c.name}</h3>{c.level && <StatusPill tone="stone">{levelLabel[c.level]}</StatusPill>}</div>
                      <p className="text-sm text-stone-600 mt-1 line-clamp-2">{c.description}</p>
                      <p className="text-xs text-stone-500 mt-2">{c.lecturerId ? c.lecturerName : <span className="text-amber-700 font-medium">No lecturer assigned</span>} · {n} students · {c.credits} credits</p>
                      <div className="mt-auto pt-4 flex items-center gap-2">
                        <p className="flex-1 font-bold text-emerald-700 tabular-nums">{kwacha(c.price)}</p>
                        <Button size="sm" variant="outline" onClick={() => openCourse(c)}><Pencil className="w-4 h-4" />Edit</Button>
                        <Button size="icon" variant="ghost" aria-label={`Delete ${c.name}`} onClick={() => setConfirmDelete(c)}><Trash2 className="w-4 h-4 text-stone-400" /></Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Results */}
        <TabsContent value="results">
          <SectionTitle title="Results" sub="Overall marks combine every marked assignment and exam." />
          {!rCourse ? <EmptyState icon={GraduationCap} title="No courses yet" text="Results appear once courses have marked work." /> : (() => {
            const enrolled = students.filter(s => s.courses.includes(rCourse.id)).sort((a, b) => a.name.localeCompare(b.name));
            const marks = enrolled.map(s => ({ s, m: courseMark(rCourse.id, s.id, homeworks, homeworkSubmissions, exams, examAttempts) }));
            const marked = marks.filter(x => x.m !== undefined) as { s: typeof enrolled[number]; m: number }[];
            const avg = marked.length ? Math.round(marked.reduce((a, b) => a + b.m, 0) / marked.length) : undefined;
            const passRate = marked.length ? Math.round((marked.filter(x => x.m >= FEES.passMark).length / marked.length) * 100) : undefined;
            const hwIds = homeworks.filter(h => h.courseId === rCourse.id).map(h => h.id);
            const exIds = exams.filter(e => e.courseId === rCourse.id).map(e => e.id);
            const waiting = homeworkSubmissions.filter(s => hwIds.includes(s.homeworkId) && s.grade === undefined).length + examAttempts.filter(a => a.needsMarking && exIds.includes(a.examId)).length;
            return (
              <div className="space-y-4">
                <Segmented id="res-course" value={rCourse.id} onChange={setResultsCourse} options={courses.map(c => [c.id, c.name.length > 24 ? `${c.name.slice(0, 22)}…` : c.name] as [string, string])} />
                <div className="grid grid-cols-3 gap-3">
                  {[['Class average', avg !== undefined ? `${avg}%` : '—'], ['Pass rate', passRate !== undefined ? `${passRate}%` : '—'], ['Waiting to be marked', waiting]].map(([k, v]) => (
                    <div key={k as string} className="bg-white rounded-2xl border border-stone-200 p-4"><p className="text-xs text-stone-500">{k}</p><p className="text-2xl font-bold text-stone-900 tabular-nums">{v}</p></div>
                  ))}
                </div>
                {enrolled.length === 0 ? <EmptyState icon={Users} title="No students in this course" text="Students appear here when they enrol." /> : (
                  <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
                    <table className="w-full text-sm min-w-[480px]">
                      <thead className="bg-stone-50 text-stone-600"><tr>
                        <th scope="col" className="text-left font-semibold px-4 py-3">Student</th>
                        <th scope="col" className="text-left font-semibold px-3 py-3">Overall</th>
                        <th scope="col" className="text-left font-semibold px-3 py-3">Grade</th>
                        <th scope="col" className="text-left font-semibold px-4 py-3">Result</th>
                      </tr></thead>
                      <tbody className="divide-y divide-stone-100 tabular-nums">
                        {marks.map(({ s, m }) => (
                          <tr key={s.id}>
                            <td className="px-4 py-3"><p className="font-medium text-stone-900">{s.name}</p><p className="text-xs text-stone-400">{s.studentNumber ?? '—'}</p></td>
                            <td className="px-3 py-3">{m !== undefined ? (
                              <div className="flex items-center gap-2"><div className="w-24 h-2 rounded-full bg-stone-100 overflow-hidden"><div className={`h-full rounded-full ${m >= FEES.passMark ? 'bg-emerald-600' : 'bg-red-500'}`} style={{ width: `${m}%` }} /></div><span className="font-semibold">{m}%</span></div>
                            ) : <span className="text-stone-300">—</span>}</td>
                            <td className="px-3 py-3">{m !== undefined ? <span className={`font-bold ${letterTone(m)}`}>{letter(m)}</span> : <span className="text-stone-300">—</span>}</td>
                            <td className="px-4 py-3">{m === undefined ? <StatusPill tone="stone">No marks yet</StatusPill> : m >= FEES.passMark ? <StatusPill tone="green">Pass</StatusPill> : <StatusPill tone="red">Below pass mark</StatusPill>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
        </TabsContent>

        {/* Certificates */}
        <TabsContent value="certificates">
          <SectionTitle title="Certificates" action={<Button onClick={() => setCertOpen(true)}><Plus className="w-4 h-4" />Issue certificate</Button>} />
          {(() => {
            const all = students.flatMap(s => (s.certificates ?? []).map(c => ({ ...c, studentName: s.name }))).sort((a, b) => b.issueDate.localeCompare(a.issueDate));
            return all.length === 0 ? <EmptyState icon={Award} title="No certificates issued yet" text="Issue a certificate when a student completes a course." /> : (
              <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
                {all.map(c => (
                  <div key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <Award className="w-5 h-5 text-amber-600" />
                    <div className="flex-1 min-w-[180px]"><p className="font-medium text-stone-900">{c.studentName}</p><p className="text-xs text-stone-500">{c.title}{c.courseName ? ` · ${c.courseName}` : ''} · {fmtDate(c.issueDate)} · by {c.issuerName}</p></div>
                  </div>
                ))}
              </div>
            );
          })()}
        </TabsContent>

        {/* Announcements */}
        <TabsContent value="announcements">
          <SectionTitle title="Announcements" sub="Shown on home pages and sent as a notification." action={<Button onClick={() => setAnnOpen(true)}><Plus className="w-4 h-4" />New announcement</Button>} />
          {announcements.length === 0 ? <EmptyState icon={Megaphone} title="No announcements" text="Post news, closures or exam dates for everyone to see." /> : (
            <div className="grid gap-3">
              {[...announcements].sort((a, b) => b.date.localeCompare(a.date)).map(a => (
                <div key={a.id} className={`bg-white rounded-2xl border p-4 sm:p-5 flex gap-3 ${a.type === 'urgent' ? 'border-red-200' : 'border-stone-200'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {a.type === 'urgent' && <StatusPill tone="red">Urgent</StatusPill>}
                      {a.type === 'academic' && <StatusPill tone="emerald">Academic</StatusPill>}
                      <StatusPill tone="stone">{a.audience === 'all' ? 'Everyone' : a.audience === 'students' ? 'Students' : a.audience === 'lecturers' ? 'Lecturers' : courses.find(c => c.id === a.courseId)?.name ?? 'Course'}</StatusPill>
                    </div>
                    <p className="mt-2 font-semibold text-stone-900">{a.title}</p>
                    <p className="text-sm text-stone-600 mt-1 whitespace-pre-line">{a.content}</p>
                    <p className="text-xs text-stone-400 mt-2">{a.authorName} · {fmtDate(a.date, true)}</p>
                  </div>
                  <Button size="icon" variant="ghost" aria-label="Delete announcement" onClick={() => { deleteAnnouncement(a.id); toast.success('Announcement removed'); }}><Trash2 className="w-4 h-4 text-stone-400" /></Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ---------- Dialogs ---------- */}
      <Dialog open={!!courseDialog} onOpenChange={o => !o && setCourseDialog(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto">
          <DialogHeader className="text-left"><DialogTitle>{courseDialog === 'new' ? 'New course' : 'Edit course'}</DialogTitle><DialogDescription>Students see the name, description, level and fee in the course catalogue.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="cf-name">Course name</Label><Input id="cf-name" value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} placeholder="e.g. Computer Networking" /></div>
            <div className="space-y-1.5"><Label htmlFor="cf-desc">Description</Label><Textarea id="cf-desc" rows={3} value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="cf-price">Fee (ZMW)</Label><Input id="cf-price" type="number" min={0} value={courseForm.price} onChange={e => setCourseForm({ ...courseForm, price: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label htmlFor="cf-cred">Credits</Label><Input id="cf-cred" type="number" min={0} value={courseForm.credits} onChange={e => setCourseForm({ ...courseForm, credits: Number(e.target.value) })} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="cf-level">Level</Label>
                <Select value={courseForm.level} onValueChange={(v: NonNullable<Course['level']>) => setCourseForm({ ...courseForm, level: v })}><SelectTrigger id="cf-level"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(levelLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label htmlFor="cf-lec">Lecturer</Label>
                <Select value={courseForm.lecturerId || 'none'} onValueChange={v => setCourseForm({ ...courseForm, lecturerId: v === 'none' ? '' : v })}><SelectTrigger id="cf-lec"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Assign later</SelectItem>{lecturers.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-img">Cover image (optional)</Label>
              <Input id="cf-img" type="file" accept="image/jpeg,image/png,image/webp" disabled={imgBusy} onChange={async e => {
                const f = e.target.files?.[0]; if (!f) return;
                setImgBusy(true);
                try { const url = await uploadSiteImage(f, 'courses', 1400); setCourseForm(cf => ({ ...cf, imageUrl: url })); toast.success('Picture uploaded'); }
                catch (err) { toast.error((err as Error).message); }
                finally { setImgBusy(false); e.target.value = ''; }
              }} />
              {imgBusy && <p className="text-xs text-stone-500 flex items-center gap-2"><Spinner />Uploading picture…</p>}
              {courseForm.imageUrl && !imgBusy && (
                <div className="relative mt-2">
                  <img src={courseForm.imageUrl} alt="" className="h-32 w-full object-cover" />
                  <button type="button" onClick={() => setCourseForm(cf => ({ ...cf, imageUrl: '' }))} className="absolute right-2 top-2 bg-white/95 px-2 py-1 text-xs font-semibold text-ink hover:bg-white">Remove</button>
                </div>
              )}
            </div>
            <Button className="w-full" onClick={saveCourse}>{courseDialog === 'new' ? 'Create course' : 'Save changes'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={o => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader className="text-left"><DialogTitle>Delete {confirmDelete?.name}?</DialogTitle>
            <DialogDescription>{confirmDelete && (() => { const n = students.filter(s => s.courses.includes(confirmDelete.id)).length; return n ? `${n} student${n === 1 ? ' is' : 's are'} enrolled. They will lose access to its materials. This can't be undone.` : "No students are enrolled. This can't be undone."; })()}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Keep course</Button>
            <Button variant="destructive" onClick={() => { if (confirmDelete) { deleteCourse(confirmDelete.id); toast.success(`${confirmDelete.name} deleted`); } setConfirmDelete(null); }}>Delete course</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={annOpen} onOpenChange={setAnnOpen}>
        <DialogContent>
          <DialogHeader className="text-left"><DialogTitle>New announcement</DialogTitle><DialogDescription>Everyone in the audience gets a notification.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="an-title">Title</Label><Input id="an-title" value={ann.title} onChange={e => setAnn({ ...ann, title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="an-body">Message</Label><Textarea id="an-body" rows={4} value={ann.content} onChange={e => setAnn({ ...ann, content: e.target.value })} /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="an-aud">Who should see it</Label>
                <Select value={ann.audience} onValueChange={(v: Announcement['audience']) => setAnn({ ...ann, audience: v })}><SelectTrigger id="an-aud"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Everyone</SelectItem><SelectItem value="students">All students</SelectItem><SelectItem value="lecturers">All lecturers</SelectItem><SelectItem value="course">One course</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label htmlFor="an-type">Type</Label>
                <Select value={ann.type} onValueChange={(v: Announcement['type']) => setAnn({ ...ann, type: v })}><SelectTrigger id="an-type"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="general">General</SelectItem><SelectItem value="academic">Academic</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select>
              </div>
            </div>
            {ann.audience === 'course' && (
              <div className="space-y-1.5"><Label htmlFor="an-course">Course</Label>
                <Select value={ann.courseId} onValueChange={v => setAnn({ ...ann, courseId: v })}><SelectTrigger id="an-course"><SelectValue placeholder="Choose a course" /></SelectTrigger><SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
              </div>
            )}
            <Button className="w-full" onClick={() => {
              if (!ann.title.trim() || !ann.content.trim()) return toast.error('Add a title and a message');
              if (ann.audience === 'course' && !ann.courseId) return toast.error('Choose the course');
              addAnnouncement({ title: ann.title.trim(), content: ann.content.trim(), type: ann.type, audience: ann.audience, courseId: ann.audience === 'course' ? ann.courseId : undefined });
              setAnn({ title: '', content: '', type: 'general', audience: 'all', courseId: '' }); setAnnOpen(false); toast.success('Announcement posted');
            }}>Post announcement</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={certOpen} onOpenChange={setCertOpen}>
        <DialogContent>
          <DialogHeader className="text-left"><DialogTitle>Issue a certificate</DialogTitle><DialogDescription>It appears on the student's Certificates page.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="sc-st">Student</Label>
              <Select value={cert.studentId} onValueChange={v => setCert({ ...cert, studentId: v })}><SelectTrigger id="sc-st"><SelectValue placeholder="Choose a student" /></SelectTrigger><SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="sc-course">Course (optional)</Label>
              <Select value={cert.courseId} onValueChange={v => setCert({ ...cert, courseId: v })}><SelectTrigger id="sc-course"><SelectValue placeholder="Choose a course" /></SelectTrigger><SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="sc-title">Title</Label><Input id="sc-title" value={cert.title} onChange={e => setCert({ ...cert, title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="sc-url">Link to the certificate file (optional)</Label><Input id="sc-url" value={cert.fileUrl} onChange={e => setCert({ ...cert, fileUrl: e.target.value })} placeholder="https://" /></div>
            <Button className="w-full" onClick={() => {
              const s = students.find(x => x.id === cert.studentId);
              const c = courses.find(x => x.id === cert.courseId);
              if (!s || !cert.title.trim()) return toast.error('Choose a student and add a title');
              addCertificate({ studentId: s.id, studentName: s.name, courseId: c?.id, courseName: c?.name, title: cert.title.trim(), fileUrl: cert.fileUrl.trim(), issueDate: new Date().toISOString(), issuerId: user.id, issuerName: user.name });
              setCert({ studentId: '', courseId: '', title: 'Certificate of Completion', fileUrl: '' }); setCertOpen(false); toast.success(`Certificate issued to ${s.name}`);
            }}>Issue certificate</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
};
