import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAuth, type Notification } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Tabs, TabsContent } from '@/app/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Home, BookOpen, CalendarDays, Video, PlayCircle, FileText, ClipboardCheck, PenLine, GraduationCap, UserCheck, Award, User, Plus, Trash2, ExternalLink, MapPin, Users, Clock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { DashboardShell, type NavItem } from './shell/DashboardShell';
import { NotificationBell } from './shell/NotificationBell';
import { SectionTitle, EmptyState, StatusPill, countdown, fmtDate } from './shell/ui';
import { LiveStream } from './LiveStream';
import { LecturerHome } from './lecturer/LecturerHome';
import { Marking } from './lecturer/Marking';
import { Gradebook } from './lecturer/Gradebook';
import { Attendance } from './lecturer/Attendance';
import { ExamBuilder } from './lecturer/ExamBuilder';
import { PasswordInput } from './AuthShell';
import { examMax } from '@/app/lib/academics';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const isUrl = (s: string) => /^https?:\/\/\S+\.\S+/.test(s.trim());

export const LecturerDashboard: React.FC = () => {
  const {
    user, users, logout, courses, timetable, liveClasses, recordings, homeworks, homeworkSubmissions, exams, examAttempts,
    addTimetableEntry, deleteTimetableEntry, addLiveClass, updateLiveClass, deleteLiveClass, addRecording, deleteRecording,
    addHomework, deleteHomework, updateExam, deleteExam, addCertificate, updateUser, attendance, changePassword,
  } = useAuth();

  const [tab, setTab] = useState('dashboard');
  const [dialog, setDialog] = useState<null | 'live' | 'assignment' | 'exam' | 'recording' | 'timetable' | 'certificate'>(null);
  const [inApp, setInApp] = useState<string | null>(null);

  const [liveForm, setLiveForm] = useState({ courseId: '', when: '', link: '' });
  const [hwForm, setHwForm] = useState({ courseId: '', title: '', description: '', due: '' });
  const [recForm, setRecForm] = useState({ courseId: '', title: '', url: '', duration: '', description: '' });
  const [ttForm, setTtForm] = useState({ courseId: '', day: '', start: '', end: '', room: '' });
  const [certForm, setCertForm] = useState({ studentId: '', courseId: '', title: 'Certificate of Completion', fileUrl: '' });
  const [profile, setProfile] = useState({ name: user?.name ?? '', bio: user?.bio ?? '', photo: user?.profilePicture ?? '' });
  const [pw, setPw] = useState({ current: '', next: '' });

  if (!user) return null;

  const myCourses = courses.filter(c => c.lecturerId === user.id);
  const myIds = new Set(myCourses.map(c => c.id));
  const myStudents = users.filter(u => u.role === 'student' && u.courses.some(c => myIds.has(c)));
  const myTimetable = timetable.filter(t => t.lecturerId === user.id);
  const myLive = liveClasses.filter(l => l.lecturerId === user.id).sort((a, b) => b.scheduledTime.localeCompare(a.scheduledTime));
  const myRecordings = recordings.filter(r => r.lecturerId === user.id).sort((a, b) => b.recordingDate.localeCompare(a.recordingDate));
  const myHw = homeworks.filter(h => h.lecturerId === user.id).sort((a, b) => b.assignedDate.localeCompare(a.assignedDate));
  const myEx = exams.filter(e => e.lecturerId === user.id).sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));
  const toMark = homeworkSubmissions.filter(s => myHw.some(h => h.id === s.homeworkId) && s.grade === undefined).length
    + examAttempts.filter(a => a.needsMarking && myEx.some(e => e.id === a.examId)).length;
  const liveNow = myLive.filter(l => l.isLive).length;

  const items: NavItem[] = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'marking', label: 'Marking', icon: PenLine, badge: toMark },
    { id: 'courses', label: 'My courses', icon: BookOpen, section: 'Teaching' },
    { id: 'live', label: 'Live classes', icon: Video, badge: liveNow, section: 'Teaching' },
    { id: 'timetable', label: 'Timetable', icon: CalendarDays, section: 'Teaching' },
    { id: 'recordings', label: 'Recordings', icon: PlayCircle, section: 'Teaching' },
    { id: 'assignments', label: 'Assignments', icon: FileText, section: 'Teaching' },
    { id: 'exams', label: 'Exams', icon: ClipboardCheck, section: 'Teaching' },
    { id: 'gradebook', label: 'Gradebook', icon: GraduationCap, section: 'Students' },
    { id: 'attendance', label: 'Attendance', icon: UserCheck, section: 'Students' },
    { id: 'certificates', label: 'Certificates', icon: Award, section: 'Students' },
    { id: 'profile', label: 'Profile', icon: User, section: 'Account' },
  ];

  const quick = (what: 'live' | 'assignment' | 'exam' | 'recording') => {
    setTab(what === 'live' ? 'live' : what === 'assignment' ? 'assignments' : what === 'exam' ? 'exams' : 'recordings');
    setDialog(what);
  };

  const openLink = (url: string) => { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noreferrer'; a.click(); };

  const startClass = (id: string) => {
    const lc = liveClasses.find(l => l.id === id);
    if (!lc) return;
    if (!lc.isLive) { updateLiveClass(id, { isLive: true }); toast.success('Class is live. Students have been notified.'); }
    if (lc.meetingUrl) openLink(lc.meetingUrl); else setInApp(id);
  };

  const courseSelect = (value: string, onChange: (v: string) => void, id: string) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}><SelectValue placeholder="Choose a course" /></SelectTrigger>
      <SelectContent>{myCourses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
    </Select>
  );

  const onNotification = (n: Notification) => { if (n.type.startsWith('live')) setTab('live'); };

  if (inApp) {
    const lc = liveClasses.find(l => l.id === inApp);
    if (lc) return <LiveStream classInfo={lc} onBack={() => setInApp(null)} isLecturer />;
  }

  return (
    <DashboardShell portal="Lecturer" user={user} items={items} active={tab} onNavigate={setTab} primary={['dashboard', 'live', 'marking', 'gradebook']} onLogout={logout}
      actions={<NotificationBell onOpen={onNotification} />}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsContent value="dashboard"><LecturerHome go={setTab} quick={quick} onStart={startClass} /></TabsContent>
        <TabsContent value="marking"><Marking /></TabsContent>
        <TabsContent value="gradebook"><Gradebook onMark={() => setTab('marking')} /></TabsContent>
        <TabsContent value="attendance"><Attendance /></TabsContent>

        {/* Courses */}
        <TabsContent value="courses">
          {myCourses.length === 0 ? <EmptyState icon={BookOpen} title="No courses assigned yet" text="Administration assigns courses to lecturers in the Staff Portal." /> : (
            <div className="grid sm:grid-cols-2 gap-4">
              {myCourses.map(c => {
                const n = users.filter(u => u.role === 'student' && u.courses.includes(c.id)).length;
                return (
                  <div key={c.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
                    <h3 className="font-bold text-stone-900">{c.name}</h3>
                    <p className="text-sm text-stone-600 mt-1">{c.description}</p>
                    <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                      {[[n, 'Students'], [homeworks.filter(h => h.courseId === c.id).length, 'Assignments'], [exams.filter(e => e.courseId === c.id).length, 'Exams'], [recordings.filter(r => r.courseId === c.id).length, 'Recordings']].map(([v, l]) => (
                        <div key={l as string} className="rounded-xl bg-stone-50 py-2"><p className="text-lg font-bold text-stone-900 tabular-nums">{v}</p><p className="text-[11px] text-stone-500">{l}</p></div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Live classes */}
        <TabsContent value="live">
          <SectionTitle title="Live classes" sub="Paste your Zoom, Google Meet or Jitsi link. Students join from their portal and are marked present." action={<Button onClick={() => setDialog('live')}><Plus className="w-4 h-4" />Schedule class</Button>} />
          {myLive.length === 0 ? <EmptyState icon={Video} title="No live classes yet" text="Schedule your first class. Students get a notification straight away." action={<Button onClick={() => setDialog('live')}>Schedule class</Button>} /> : (
            <div className="grid gap-3">
              {myLive.map(l => {
                const past = !l.isLive && new Date(l.scheduledTime) < new Date();
                const present = attendance.filter(a => a.liveClassId === l.id).length;
                return (
                  <div key={l.id} className={`bg-white rounded-2xl border p-4 flex flex-wrap items-center gap-3 ${l.isLive ? 'border-red-300 ring-1 ring-red-200' : 'border-stone-200'}`}>
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2">{l.isLive && <StatusPill tone="red">Live</StatusPill>}<p className="font-semibold text-stone-900">{l.courseName}</p></div>
                      <p className="text-sm text-stone-500">{fmtDate(l.scheduledTime, true)}{!past && !l.isLive && ` · ${countdown(new Date(l.scheduledTime))}`}</p>
                      {l.meetingUrl ? <p className="text-xs text-emerald-700 truncate max-w-[320px]">{l.meetingUrl}</p> : <p className="text-xs text-stone-400">Uses the built-in classroom</p>}
                    </div>
                    {(past || l.isLive) && <StatusPill tone="stone"><Users className="w-3 h-3" />{present} attended</StatusPill>}
                    {l.isLive ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startClass(l.id)}><ExternalLink className="w-4 h-4" />Open</Button>
                        <Button size="sm" variant="destructive" onClick={() => { updateLiveClass(l.id, { isLive: false }); toast.success('Class ended'); }}>End class</Button>
                      </>
                    ) : !past ? (
                      <Button size="sm" onClick={() => startClass(l.id)}><Video className="w-4 h-4" />Go live</Button>
                    ) : null}
                    <Button size="icon" variant="ghost" aria-label="Delete class" onClick={() => { deleteLiveClass(l.id); toast.success('Class removed'); }}><Trash2 className="w-4 h-4 text-stone-400" /></Button>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Timetable */}
        <TabsContent value="timetable">
          <SectionTitle title="Weekly timetable" sub="Recurring class times your students see in their calendar." action={<Button onClick={() => setDialog('timetable')}><Plus className="w-4 h-4" />Add class time</Button>} />
          {myTimetable.length === 0 ? <EmptyState icon={CalendarDays} title="No class times yet" text="Add your weekly class times so students know when and where to be." /> : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {DAY_NAMES.map(d => {
                const items = myTimetable.filter(t => t.day === d);
                if (!items.length) return null;
                return (
                  <div key={d} className="bg-white rounded-2xl border border-stone-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">{d}</p>
                    <ul className="space-y-2">
                      {items.map(t => (
                        <li key={t.id} className="flex items-start gap-2 rounded-xl bg-stone-50 p-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-emerald-800 tabular-nums">{t.time}</p>
                            <p className="text-sm font-medium text-stone-900">{t.courseName}</p>
                            <p className="text-xs text-stone-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{t.room}</p>
                          </div>
                          <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => deleteTimetableEntry(t.id)}><Trash2 className="w-4 h-4 text-stone-400" /></Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Recordings */}
        <TabsContent value="recordings">
          <SectionTitle title="Recordings" sub="Link to recordings on YouTube (unlisted), Google Drive or Zoom cloud." action={<Button onClick={() => setDialog('recording')}><Plus className="w-4 h-4" />Add recording</Button>} />
          {myRecordings.length === 0 ? <EmptyState icon={PlayCircle} title="No recordings yet" text="After a class, add the recording link so students can revise." /> : (
            <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
              {myRecordings.map(r => (
                <div key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <PlayCircle className="w-5 h-5 text-emerald-700" />
                  <div className="flex-1 min-w-[180px]"><p className="font-medium text-stone-900">{r.title}</p><p className="text-xs text-stone-500">{r.courseName} · {fmtDate(r.recordingDate)} · {r.duration}</p></div>
                  {isUrl(r.recordingUrl) && <a href={r.recordingUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-emerald-700 inline-flex items-center gap-1">Open<ExternalLink className="w-3.5 h-3.5" /></a>}
                  <Button size="icon" variant="ghost" aria-label="Delete recording" onClick={() => deleteRecording(r.id)}><Trash2 className="w-4 h-4 text-stone-400" /></Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Assignments */}
        <TabsContent value="assignments">
          <SectionTitle title="Assignments" action={<Button onClick={() => setDialog('assignment')}><Plus className="w-4 h-4" />Post assignment</Button>} />
          {myHw.length === 0 ? <EmptyState icon={FileText} title="No assignments yet" text="Post an assignment and students are notified straight away." /> : (
            <div className="grid gap-3">
              {myHw.map(h => {
                const enrolled = users.filter(u => u.role === 'student' && u.courses.includes(h.courseId)).length;
                const subs = homeworkSubmissions.filter(s => s.homeworkId === h.id);
                const unmarked = subs.filter(s => s.grade === undefined).length;
                const overdue = new Date(h.dueDate) < new Date();
                return (
                  <div key={h.id} className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <p className="font-semibold text-stone-900">{h.title}</p>
                      <p className="text-xs text-stone-500">{h.courseName} · due {fmtDate(h.dueDate, true)}{overdue && ' (closed)'}</p>
                    </div>
                    <StatusPill tone="stone">{subs.length}/{enrolled} submitted</StatusPill>
                    {unmarked > 0 ? <button onClick={() => setTab('marking')}><StatusPill tone="amber">{unmarked} to mark</StatusPill></button> : subs.length > 0 && <StatusPill tone="green">All marked</StatusPill>}
                    <Button size="icon" variant="ghost" aria-label="Delete assignment" onClick={() => { deleteHomework(h.id); toast.success('Assignment deleted'); }}><Trash2 className="w-4 h-4 text-stone-400" /></Button>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Exams */}
        <TabsContent value="exams">
          <SectionTitle title="Exams" sub="Build exams with questions. Objective answers are marked automatically." action={<Button onClick={() => setDialog('exam')}><Plus className="w-4 h-4" />Build exam</Button>} />
          {myEx.length === 0 ? <EmptyState icon={ClipboardCheck} title="No exams yet" text="Build an exam with multiple choice, true/false, short answer or essay questions." action={<Button onClick={() => setDialog('exam')}>Build exam</Button>} /> : (
            <div className="grid gap-3">
              {myEx.map(e => {
                const atts = examAttempts.filter(a => a.examId === e.id && a.isSubmitted);
                const pending = atts.filter(a => a.needsMarking).length;
                return (
                  <div key={e.id} className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2">{!e.isPublished && <StatusPill tone="stone">Draft</StatusPill>}<p className="font-semibold text-stone-900">{e.title}</p></div>
                      <p className="text-xs text-stone-500 flex flex-wrap items-center gap-x-2">{e.courseName} · {fmtDate(e.scheduledDate, true)} <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{e.duration} min</span> · {e.questions.length} questions · {examMax(e)} marks</p>
                    </div>
                    <StatusPill tone="stone">{atts.length} submitted</StatusPill>
                    {pending > 0 && <button onClick={() => setTab('marking')}><StatusPill tone="amber">{pending} to mark</StatusPill></button>}
                    <Button size="sm" variant="outline" onClick={() => { updateExam(e.id, { isPublished: !e.isPublished }); toast.success(e.isPublished ? 'Exam hidden from students' : 'Exam published'); }}>
                      {e.isPublished ? <><EyeOff className="w-4 h-4" />Unpublish</> : <><Eye className="w-4 h-4" />Publish</>}
                    </Button>
                    <Button size="icon" variant="ghost" aria-label="Delete exam" onClick={() => { deleteExam(e.id); toast.success('Exam deleted'); }}><Trash2 className="w-4 h-4 text-stone-400" /></Button>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Certificates */}
        <TabsContent value="certificates">
          <SectionTitle title="Certificates" sub="Issue a certificate to a student in one of your courses." action={<Button onClick={() => setDialog('certificate')}><Plus className="w-4 h-4" />Issue certificate</Button>} />
          {(() => {
            const issued = users.flatMap(u => (u.certificates ?? []).map(c => ({ ...c, studentName: u.name }))).filter(c => c.issuerId === user.id);
            return issued.length === 0 ? <EmptyState icon={Award} title="None issued yet" text="Certificates you issue appear here." /> : (
              <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
                {issued.map(c => (
                  <div key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <Award className="w-5 h-5 text-amber-600" />
                    <div className="flex-1"><p className="font-medium text-stone-900">{c.studentName}</p><p className="text-xs text-stone-500">{c.title} · {fmtDate(c.issueDate)}</p></div>
                  </div>
                ))}
              </div>
            );
          })()}
        </TabsContent>

        {/* Profile */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 items-start">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 text-center shadow-sm">
              <Avatar className="w-24 h-24 mx-auto"><AvatarImage src={profile.photo} /><AvatarFallback className="bg-amber-100 text-amber-800 text-2xl font-bold">{user.name.replace(/^(Mr|Ms|Mrs|Dr)\.?\s/, '')[0]}</AvatarFallback></Avatar>
              <p className="mt-3 font-bold text-stone-900">{user.name}</p>
              <p className="text-sm text-stone-500">{myCourses.length} courses · {myStudents.length} students</p>
              <Label htmlFor="lec-photo" className="mt-4 cursor-pointer inline-flex rounded-full border border-stone-200 px-4 py-2 text-sm hover:bg-stone-50">Change photo</Label>
              <input id="lec-photo" type="file" accept="image/*" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onloadend = () => setProfile(p => ({ ...p, photo: r.result as string })); r.readAsDataURL(f); }} />
            </div>
            <div className="space-y-6">
              <section className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-4 shadow-sm">
                <div className="space-y-1.5"><Label htmlFor="lp-name">Full name</Label><Input id="lp-name" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="lp-bio">Bio and qualifications</Label><Textarea id="lp-bio" rows={4} value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} /></div>
                <Button onClick={() => { updateUser({ name: profile.name, bio: profile.bio, profilePicture: profile.photo }); toast.success('Profile saved'); }}>Save changes</Button>
              </section>
              <section className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-4 shadow-sm">
                <h3 className="font-bold text-stone-900 flex items-center gap-2"><KeyRound className="w-4 h-4" />Change password</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label htmlFor="lpw-c">Current password</Label><PasswordInput id="lpw-c" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label htmlFor="lpw-n">New password</Label><PasswordInput id="lpw-n" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} /></div>
                </div>
                <Button variant="outline" onClick={() => {
                  if (!pw.current) return void toast.error('Enter your current password');
                  if (pw.next.length < 6) return toast.error('Use at least 6 characters');
                  changePassword(pw.current, pw.next).then(err => { if (err) toast.error(err); else { setPw({ current: '', next: '' }); toast.success('Password changed'); } });
                }}>Update password</Button>
              </section>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ---------- Dialogs ---------- */}
      <ExamBuilder open={dialog === 'exam'} onOpenChange={o => setDialog(o ? 'exam' : null)} />

      <Dialog open={dialog === 'live'} onOpenChange={o => setDialog(o ? 'live' : null)}>
        <DialogContent>
          <DialogHeader className="text-left"><DialogTitle>Schedule a live class</DialogTitle><DialogDescription>Students are notified and see a countdown on their home page.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="lv-course">Course</Label>{courseSelect(liveForm.courseId, v => setLiveForm({ ...liveForm, courseId: v }), 'lv-course')}</div>
            <div className="space-y-1.5"><Label htmlFor="lv-when">Date and time</Label><Input id="lv-when" type="datetime-local" value={liveForm.when} onChange={e => setLiveForm({ ...liveForm, when: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label htmlFor="lv-link">Meeting link (Zoom, Google Meet or Jitsi)</Label>
              <Input id="lv-link" value={liveForm.link} onChange={e => setLiveForm({ ...liveForm, link: e.target.value })} placeholder="https://meet.google.com/abc-defg-hij" />
              <p className="text-xs text-stone-500">Leave empty to use the built-in classroom.</p>
            </div>
            <Button className="w-full" onClick={() => {
              const c = myCourses.find(x => x.id === liveForm.courseId);
              if (!c || !liveForm.when) return toast.error('Choose a course and a time');
              if (liveForm.link && !isUrl(liveForm.link)) return toast.error('The meeting link should start with https://');
              addLiveClass({ courseId: c.id, courseName: c.name, scheduledTime: new Date(liveForm.when).toISOString(), lecturerId: user.id, lecturerName: user.name, isLive: false, meetingUrl: liveForm.link.trim() || undefined });
              setLiveForm({ courseId: '', when: '', link: '' }); setDialog(null); toast.success('Class scheduled');
            }}>Schedule class</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'assignment'} onOpenChange={o => setDialog(o ? 'assignment' : null)}>
        <DialogContent>
          <DialogHeader className="text-left"><DialogTitle>Post an assignment</DialogTitle><DialogDescription>Students in the course are notified straight away.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="hw-course">Course</Label>{courseSelect(hwForm.courseId, v => setHwForm({ ...hwForm, courseId: v }), 'hw-course')}</div>
            <div className="space-y-1.5"><Label htmlFor="hw-title">Title</Label><Input id="hw-title" value={hwForm.title} onChange={e => setHwForm({ ...hwForm, title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="hw-desc">Instructions</Label><Textarea id="hw-desc" rows={4} value={hwForm.description} onChange={e => setHwForm({ ...hwForm, description: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="hw-due">Due</Label><Input id="hw-due" type="datetime-local" value={hwForm.due} onChange={e => setHwForm({ ...hwForm, due: e.target.value })} /></div>
            <Button className="w-full" onClick={() => {
              const c = myCourses.find(x => x.id === hwForm.courseId);
              if (!c || !hwForm.title.trim() || !hwForm.due) return toast.error('Choose a course, add a title and a due date');
              addHomework({ courseId: c.id, courseName: c.name, lecturerId: user.id, title: hwForm.title.trim(), description: hwForm.description.trim(), assignedDate: new Date().toISOString(), dueDate: new Date(hwForm.due).toISOString() });
              setHwForm({ courseId: '', title: '', description: '', due: '' }); setDialog(null); toast.success('Assignment posted');
            }}>Post assignment</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'recording'} onOpenChange={o => setDialog(o ? 'recording' : null)}>
        <DialogContent>
          <DialogHeader className="text-left"><DialogTitle>Add a recording</DialogTitle><DialogDescription>Upload the video to YouTube (unlisted), Google Drive or Zoom cloud, then paste the link.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="rc-course">Course</Label>{courseSelect(recForm.courseId, v => setRecForm({ ...recForm, courseId: v }), 'rc-course')}</div>
            <div className="space-y-1.5"><Label htmlFor="rc-title">Title</Label><Input id="rc-title" value={recForm.title} onChange={e => setRecForm({ ...recForm, title: e.target.value })} placeholder="e.g. Week 3: Routing protocols" /></div>
            <div className="space-y-1.5"><Label htmlFor="rc-url">Video link</Label><Input id="rc-url" value={recForm.url} onChange={e => setRecForm({ ...recForm, url: e.target.value })} placeholder="https://" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="rc-dur">Length</Label><Input id="rc-dur" value={recForm.duration} onChange={e => setRecForm({ ...recForm, duration: e.target.value })} placeholder="1h 20m" /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="rc-desc">Description (optional)</Label><Textarea id="rc-desc" rows={2} value={recForm.description} onChange={e => setRecForm({ ...recForm, description: e.target.value })} /></div>
            <Button className="w-full" onClick={() => {
              const c = myCourses.find(x => x.id === recForm.courseId);
              if (!c || !recForm.title.trim() || !isUrl(recForm.url)) return toast.error('Choose a course, add a title and a link starting with https://');
              addRecording({ courseId: c.id, courseName: c.name, lecturerId: user.id, lecturerName: user.name, title: recForm.title.trim(), recordingUrl: recForm.url.trim(), duration: recForm.duration || '—', recordingDate: new Date().toISOString(), description: recForm.description.trim() });
              setRecForm({ courseId: '', title: '', url: '', duration: '', description: '' }); setDialog(null); toast.success('Recording added. Students have been notified.');
            }}>Add recording</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'timetable'} onOpenChange={o => setDialog(o ? 'timetable' : null)}>
        <DialogContent>
          <DialogHeader className="text-left"><DialogTitle>Add a weekly class time</DialogTitle><DialogDescription>Repeats every week.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="tt-course">Course</Label>{courseSelect(ttForm.courseId, v => setTtForm({ ...ttForm, courseId: v }), 'tt-course')}</div>
            <div className="space-y-1.5"><Label htmlFor="tt-day">Day</Label>
              <Select value={ttForm.day} onValueChange={v => setTtForm({ ...ttForm, day: v })}><SelectTrigger id="tt-day"><SelectValue placeholder="Choose a day" /></SelectTrigger><SelectContent>{DAY_NAMES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="tt-s">Starts</Label><Input id="tt-s" type="time" value={ttForm.start} onChange={e => setTtForm({ ...ttForm, start: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="tt-e">Ends</Label><Input id="tt-e" type="time" value={ttForm.end} onChange={e => setTtForm({ ...ttForm, end: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="tt-room">Room or "Online"</Label><Input id="tt-room" value={ttForm.room} onChange={e => setTtForm({ ...ttForm, room: e.target.value })} /></div>
            <Button className="w-full" onClick={() => {
              const c = myCourses.find(x => x.id === ttForm.courseId);
              if (!c || !ttForm.day || !ttForm.start || !ttForm.room) return toast.error('Fill in the course, day, start time and room');
              addTimetableEntry({ courseId: c.id, courseName: c.name, day: ttForm.day, time: ttForm.end ? `${ttForm.start} - ${ttForm.end}` : ttForm.start, room: ttForm.room, lecturerId: user.id, lecturerName: user.name });
              setTtForm({ courseId: '', day: '', start: '', end: '', room: '' }); setDialog(null); toast.success('Class time added');
            }}>Add to timetable</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'certificate'} onOpenChange={o => setDialog(o ? 'certificate' : null)}>
        <DialogContent>
          <DialogHeader className="text-left"><DialogTitle>Issue a certificate</DialogTitle><DialogDescription>It appears in the student's Certificates page.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="ct-st">Student</Label>
              <Select value={certForm.studentId} onValueChange={v => setCertForm({ ...certForm, studentId: v })}><SelectTrigger id="ct-st"><SelectValue placeholder="Choose a student" /></SelectTrigger><SelectContent>{myStudents.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="ct-course">Course</Label>{courseSelect(certForm.courseId, v => setCertForm({ ...certForm, courseId: v }), 'ct-course')}</div>
            <div className="space-y-1.5"><Label htmlFor="ct-title">Title</Label><Input id="ct-title" value={certForm.title} onChange={e => setCertForm({ ...certForm, title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="ct-url">Link to the certificate file (optional)</Label><Input id="ct-url" value={certForm.fileUrl} onChange={e => setCertForm({ ...certForm, fileUrl: e.target.value })} placeholder="https://" /></div>
            <Button className="w-full" onClick={() => {
              const s = myStudents.find(x => x.id === certForm.studentId);
              const c = myCourses.find(x => x.id === certForm.courseId);
              if (!s || !certForm.title.trim()) return toast.error('Choose a student and add a title');
              addCertificate({ studentId: s.id, studentName: s.name, courseId: c?.id, courseName: c?.name, title: certForm.title.trim(), fileUrl: certForm.fileUrl.trim(), issueDate: new Date().toISOString(), issuerId: user.id, issuerName: user.name });
              setCertForm({ studentId: '', courseId: '', title: 'Certificate of Completion', fileUrl: '' }); setDialog(null); toast.success(`Certificate issued to ${s.name}`);
            }}>Issue certificate</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
};
