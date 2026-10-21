import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { Session } from '@supabase/supabase-js';
import { supabase, toRow, fromRow, newId, friendlyError, siteUrl, initialAuthLink } from '@/app/lib/supabase';

/* ============================== Types ============================== */

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  type: 'registration' | 'course_fee';
  status: 'completed' | 'pending' | 'failed';
}

export interface StudentPersonalDetails {
  dateOfBirth: string;
  gender: string;
  address: string;
  residentialAddress: string;
  postalAddress: string;
  nrcNumber: string;
  passportNumber?: string;
  phoneNumber: string;
  alternativeNumber: string;
  guardianName: string;
  guardianPhone: string;
  nationality: string;
  program?: string;
  hasCompletedRegistration?: boolean;
  sponsorshipType?: 'self' | 'bursary' | 'corporate';
}

export interface Enrollment {
  courseId: string;
  type: 'full-time' | 'part-time';
  paymentPlan: 'full' | 'installments-3' | 'installments-6';
  totalAmount: number;
  amountPaid: number; // confirmed by Finance
  enrolledAt: string;
}

export type StaffRole = 'admin' | 'finance' | 'registrar';

export interface StaffInvite {
  email: string;
  name: string;
  role: 'lecturer' | 'staff';
  staffRole?: StaffRole;
  createdAt: string;
  acceptedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'lecturer' | 'staff';
  staffRole?: StaffRole;          // staff only: what they're allowed to manage
  active?: boolean;               // switched-off accounts can't sign in
  courses: string[];
  enrollments?: Enrollment[];
  bio?: string;
  profilePicture?: string;
  hasCompletedPayment?: boolean; // registration fee submitted
  studentNumber?: string;        // assigned when Finance confirms the registration fee
  personalDetails?: StudentPersonalDetails;
  transactions?: Transaction[];
  certificates?: Certificate[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: 'student' | 'lecturer' | 'staff';
  action: 'login' | 'join_class' | 'leave_class' | 'taught_class';
  timestamp: string;
  details?: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  lecturerId: string;
  lecturerName: string;
  credits: number;
  price: number;
  currency: string;
  syllabus?: string;
  level?: 'beginner' | 'advanced' | 'teveta_level_3';
  imageUrl?: string;
}

export interface LectureRecording {
  id: string;
  courseId: string;
  courseName: string;
  lecturerId: string;
  lecturerName: string;
  title: string;
  recordingDate: string;
  duration: string;
  recordingUrl: string;
  description?: string;
}

export interface Homework {
  id: string;
  courseId: string;
  courseName: string;
  lecturerId: string;
  title: string;
  description: string;
  attachment?: string;
  assignedDate: string;
  dueDate: string;
  submissions?: HomeworkSubmission[];
}

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  content: string;
  submittedAt: string;
  grade?: number;      // percent
  feedback?: string;
  gradedAt?: string;
}

export interface ExamQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'essay' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer?: string;
  marks: number;
}

export interface Exam {
  id: string;
  courseId: string;
  courseName: string;
  lecturerId: string;
  lecturerName: string;
  title: string;
  description: string;
  attachment?: string;
  scheduledDate: string;
  duration: number; // minutes
  totalMarks: number;
  questions: ExamQuestion[];
  isPublished: boolean;
  createdAt: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  startTime: string;
  endTime?: string;
  answers: { [questionId: string]: string };
  score?: number;          // total marks once known
  autoScore?: number;      // marks from auto-marked questions
  essayMarks?: { [questionId: string]: number };
  needsMarking?: boolean;  // essays waiting for the lecturer
  feedback?: string;
  markedAt?: string;
  isSubmitted: boolean;
  isAutoSubmitted?: boolean;
}

export interface Certificate {
  id: string;
  studentId: string;
  studentName: string;
  courseId?: string;
  courseName?: string;
  title: string;
  issueDate: string;
  fileUrl: string;
  issuerId: string;
  issuerName: string;
}

export interface TimetableEntry {
  id: string;
  courseId: string;
  courseName: string;
  day: string;
  time: string;
  room: string;
  lecturerId: string;
  lecturerName: string;
}

export interface LiveClass {
  id: string;
  courseId: string;
  courseName: string;
  scheduledTime: string;
  lecturerId: string;
  lecturerName: string;
  isLive: boolean;
  meetingUrl?: string; // Zoom, Google Meet or Jitsi link
  streamUrl?: string;
}

export interface Notification {
  id: string;
  type: 'live_class_scheduled' | 'live_class_started' | 'timetable_update' | 'course_update' | 'enrollment' | 'new_material' | 'assignment_posted' | 'assignment_graded' | 'exam_scheduled' | 'exam_starting_soon' | 'exam_graded' | 'payment_confirmed' | 'payment_rejected' | 'announcement';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  relatedId?: string;
  courseId?: string;
  userId?: string; // when set, only this person sees it
  recipientRole?: 'student' | 'lecturer' | 'all';
}

export type PaymentPurpose = 'registration' | 'course_fee' | 'certificate';
export type PaymentMethod = 'mtn' | 'airtel' | 'bank' | 'cash';

export interface PaymentClaim {
  id: string;
  studentId: string;
  studentName: string;
  purpose: PaymentPurpose;
  courseId?: string;
  courseName?: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  payerPhone?: string;
  note?: string;
  submittedAt: string;
  status: 'pending' | 'confirmed' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface AttendanceRecord {
  id: string;
  liveClassId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  joinedAt: string;
  markedBy: 'auto' | 'lecturer';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'academic' | 'urgent';
  audience: 'all' | 'students' | 'lecturers' | 'course';
  courseId?: string;
  date: string;
  authorName: string;
}

/* ============================== Context shape ============================== */

export type AuthLink = 'invite' | 'recovery' | null;

interface AuthContextType {
  /** True while the session and data are loading for the first time. */
  loading: boolean;
  /** Set when someone arrives from an invite or password-reset email and must choose a password. */
  authLink: AuthLink;

  user: User | null;
  users: User[];
  courses: Course[];
  timetable: TimetableEntry[];
  liveClasses: LiveClass[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
  recordings: LectureRecording[];
  homeworks: Homework[];
  exams: Exam[];
  homeworkSubmissions: HomeworkSubmission[];
  examAttempts: ExamAttempt[];
  paymentClaims: PaymentClaim[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  staffInvites: StaffInvite[];

  login: (email: string, password: string) => Promise<string | null>;
  signup: (name: string, email: string, password: string) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<string | null>;
  setNewPassword: (password: string) => Promise<string | null>;
  changePassword: (current: string, next: string) => Promise<string | null>;
  updateUser: (userData: Partial<User>) => void;
  refresh: () => Promise<void>;

  inviteStaff: (invite: { name: string; email: string; role: 'lecturer' | 'staff'; staffRole?: StaffRole }) => Promise<string | null>;
  cancelInvite: (email: string) => void;
  updateAccount: (userId: string, updates: { active?: boolean; staffRole?: StaffRole }) => void;

  addCourse: (course: Omit<Course, 'id'>) => void;
  updateCourse: (courseId: string, updates: Partial<Course>) => void;
  deleteCourse: (courseId: string) => void;
  addTimetableEntry: (entry: Omit<TimetableEntry, 'id'>) => void;
  updateTimetableEntry: (entryId: string, updates: Partial<TimetableEntry>) => void;
  deleteTimetableEntry: (entryId: string) => void;
  addLiveClass: (liveClass: Omit<LiveClass, 'id'>) => void;
  updateLiveClass: (classId: string, updates: Partial<LiveClass>) => void;
  deleteLiveClass: (classId: string) => void;
  enrollInCourse: (courseId: string, type?: Enrollment['type'], paymentPlan?: Enrollment['paymentPlan']) => void;

  addNotification: (notification: Omit<Notification, 'id'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsRead: (ids: string[]) => void;
  clearAllNotifications: () => void;
  logActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;

  addRecording: (recording: Omit<LectureRecording, 'id'>) => void;
  deleteRecording: (id: string) => void;
  addHomework: (homework: Omit<Homework, 'id'>) => void;
  deleteHomework: (id: string) => void;
  submitHomework: (submission: Omit<HomeworkSubmission, 'id' | 'submittedAt'>) => void;
  gradeSubmission: (submissionId: string, grade: number, feedback?: string) => void;

  addExam: (exam: Omit<Exam, 'id'>) => void;
  updateExam: (examId: string, updates: Partial<Exam>) => void;
  deleteExam: (examId: string) => void;
  startExamAttempt: (examId: string, studentId: string, studentName: string) => ExamAttempt;
  updateExamAttempt: (attemptId: string, updates: Partial<ExamAttempt>) => void;
  submitExamAttempt: (attemptId: string, isAutoSubmit?: boolean) => void;
  markExamAttempt: (attemptId: string, essayMarks: Record<string, number>, feedback?: string) => void;

  submitPayment: (claim: Omit<PaymentClaim, 'id' | 'submittedAt' | 'status' | 'studentId' | 'studentName'>) => void;
  reviewPayment: (claimId: string, decision: 'confirmed' | 'rejected', reason?: string) => void;

  recordAttendance: (liveClassId: string, studentId: string, markedBy?: AttendanceRecord['markedBy']) => void;
  removeAttendance: (liveClassId: string, studentId: string) => void;

  addAnnouncement: (a: Omit<Announcement, 'id' | 'date' | 'authorName'>) => void;
  deleteAnnouncement: (id: string) => void;

  addCertificate: (certificate: Omit<Certificate, 'id'>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ============================== Loading from Supabase ============================== */

type Row = Record<string, unknown>;

interface Store {
  profiles: Row[];
  details: Row[];
  enrollments: Row[];
  transactions: Row[];
  certificates: Row[];
  courses: Course[];
  timetable: TimetableEntry[];
  liveClasses: LiveClass[];
  recordings: LectureRecording[];
  homeworks: Homework[];
  homeworkSubmissions: HomeworkSubmission[];
  exams: Exam[];
  examKeys: Row[];
  examAttempts: ExamAttempt[];
  paymentClaims: PaymentClaim[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  notifications: Notification[];
  reads: Row[];
  activityLogs: ActivityLog[];
  staffInvites: StaffInvite[];
}

const EMPTY: Store = {
  profiles: [], details: [], enrollments: [], transactions: [], certificates: [], courses: [], timetable: [], liveClasses: [],
  recordings: [], homeworks: [], homeworkSubmissions: [], exams: [], examKeys: [], examAttempts: [], paymentClaims: [],
  attendance: [], announcements: [], notifications: [], reads: [], activityLogs: [], staffInvites: [],
};

/** Which table feeds which part of the store, and how to read it. */
const SOURCES: Record<keyof Store, { table: string; order?: [string, boolean]; limit?: number; raw?: boolean; staffOnly?: boolean }> = {
  profiles: { table: 'profiles', raw: true },
  details: { table: 'student_details', raw: true },
  enrollments: { table: 'enrollments', raw: true },
  transactions: { table: 'transactions', raw: true },
  certificates: { table: 'certificates', raw: true },
  courses: { table: 'courses', order: ['name', true] },
  timetable: { table: 'timetable' },
  liveClasses: { table: 'live_classes', order: ['scheduled_time', false] },
  recordings: { table: 'recordings', order: ['recording_date', false] },
  homeworks: { table: 'homeworks', order: ['assigned_date', false] },
  homeworkSubmissions: { table: 'homework_submissions' },
  exams: { table: 'exams', order: ['scheduled_date', false] },
  examKeys: { table: 'exam_keys', raw: true },
  examAttempts: { table: 'exam_attempts' },
  paymentClaims: { table: 'payment_claims', order: ['submitted_at', false] },
  attendance: { table: 'attendance' },
  announcements: { table: 'announcements', order: ['date', false] },
  notifications: { table: 'notifications', order: ['timestamp', false], limit: 200 },
  reads: { table: 'notification_reads', raw: true },
  activityLogs: { table: 'activity_logs', order: ['timestamp', false], limit: 200 },
  staffInvites: { table: 'staff_invites', order: ['created_at', false], staffOnly: true },
};

const TABLE_TO_KEY = Object.fromEntries(Object.entries(SOURCES).map(([k, v]) => [v.table, k])) as Record<string, keyof Store>;

async function loadPart(key: keyof Store): Promise<unknown[]> {
  const src = SOURCES[key];
  let q = supabase.from(src.table).select('*');
  if (src.order) q = q.order(src.order[0], { ascending: src.order[1] });
  if (src.limit) q = q.limit(src.limit);
  const { data, error } = await q;
  if (error) { if (!src.staffOnly) console.warn(`Could not load ${src.table}:`, error.message); return []; }
  return src.raw ? (data ?? []) : (data ?? []).map(r => fromRow(r as Row));
}

/** Builds the people list the screens use: a profile plus its enrolments, payments, certificates and details. */
function assembleUsers(s: Store): User[] {
  return s.profiles.map(p => {
    const u = fromRow<User>(p);
    const enr = s.enrollments.filter(e => e.student_id === u.id).map(e => fromRow<Enrollment & { studentId: string; id: string }>(e));
    const det = s.details.find(d => d.id === u.id);
    return {
      ...u,
      courses: enr.map(e => e.courseId),
      enrollments: enr.map(({ courseId, type, paymentPlan, totalAmount, amountPaid, enrolledAt }) => ({ courseId, type, paymentPlan, totalAmount: Number(totalAmount), amountPaid: Number(amountPaid), enrolledAt })),
      transactions: s.transactions.filter(t => t.student_id === u.id).map(t => fromRow<Transaction>(t)),
      certificates: s.certificates.filter(c => c.student_id === u.id).map(c => fromRow<Certificate>(c)),
      personalDetails: det ? (det.personal_details as StudentPersonalDetails) : undefined,
    };
  });
}

/* ============================== Provider ============================== */

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [store, setStore] = useState<Store>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [authLink, setAuthLink] = useState<AuthLink>(initialAuthLink);
  const sessionUserId = session?.user.id ?? null;

  const patch = useCallback(<K extends keyof Store>(key: K, fn: (prev: Store[K]) => Store[K]) => {
    setStore(s => ({ ...s, [key]: fn(s[key]) }));
  }, []);

  const reload = useCallback(async (keys: (keyof Store)[]) => {
    const parts = await Promise.all(keys.map(k => loadPart(k)));
    setStore(s => { const n = { ...s }; keys.forEach((k, i) => { (n as Record<string, unknown>)[k] = parts[i]; }); return n; });
  }, []);

  const loadEverything = useCallback(async () => {
    const keys = Object.keys(SOURCES) as (keyof Store)[];
    await reload(keys);
  }, [reload]);

  // Public catalogue for visitors who aren't signed in
  const loadCatalogue = useCallback(async () => {
    const courses = (await loadPart('courses')) as Course[];
    setStore({ ...EMPTY, courses });
  }, []);

  /* ---------- Session ---------- */

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => { if (!cancelled) setSession(data.session); if (!data.session) setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setAuthLink('recovery');
      setSession(s);
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (sessionUserId) {
        setLoading(true);
        await loadEverything();
      } else {
        await loadCatalogue();
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [sessionUserId, loadEverything, loadCatalogue]);

  // Live updates: when anything the person can see changes, reload that table.
  const pending = useRef(new Set<keyof Store>());
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!sessionUserId) return;
    const channel = supabase.channel('portal-live')
      .on('postgres_changes', { event: '*', schema: 'public' }, payload => {
        const key = TABLE_TO_KEY[payload.table];
        if (!key) return;
        pending.current.add(key);
        if (payload.table === 'payment_claims') ['transactions', 'enrollments', 'profiles'].forEach(k => pending.current.add(k as keyof Store));
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => { const keys = [...pending.current]; pending.current.clear(); reload(keys); }, 400);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); window.clearTimeout(timer.current); };
  }, [sessionUserId, reload]);

  /* ---------- Derived data ---------- */

  const users = useMemo(() => assembleUsers(store), [store]);
  const user = useMemo(() => users.find(u => u.id === sessionUserId) ?? null, [users, sessionUserId]);

  const exams = useMemo(() => store.exams.map(e => {
    const key = store.examKeys.find(k => k.exam_id === e.id)?.answers as Record<string, string> | undefined;
    return key ? { ...e, questions: e.questions.map(q => (key[q.id] !== undefined ? { ...q, correctAnswer: key[q.id] } : q)) } : e;
  }), [store.exams, store.examKeys]);

  const notifications = useMemo(() => {
    const read = new Set(store.reads.filter(r => r.user_id === sessionUserId).map(r => r.notification_id as string));
    return store.notifications.map(n => ({ ...n, isRead: read.has(n.id) }));
  }, [store.notifications, store.reads, sessionUserId]);

  /* ---------- Writing ---------- */

  /** Runs a database write; if it fails, tells the person and reloads the affected data. */
  const run = useCallback(async (keys: (keyof Store)[], op: () => PromiseLike<{ error: { message: string } | null }>, quiet = false) => {
    const { error } = await op();
    if (error) {
      if (!quiet) toast.error(friendlyError(error.message));
      await reload(keys);
      return false;
    }
    return true;
  }, [reload]);

  const now = () => new Date().toISOString();

  const logActivity = useCallback((log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const item: ActivityLog = { ...log, id: newId(), timestamp: now() };
    patch('activityLogs', prev => [item, ...prev]);
    run(['activityLogs'], () => supabase.from('activity_logs').insert(toRow(item)), true);
  }, [patch, run]);

  const addNotification = useCallback((n: Omit<Notification, 'id'>) => {
    const item = { ...n, id: newId() };
    run(['notifications'], () => supabase.from('notifications').insert(toRow(item, ['isRead'])), true);
  }, [run]);

  /* ---------- Accounts ---------- */

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return friendlyError(error.message);
    const { data: prof } = await supabase.from('profiles').select('name, role, active').eq('id', data.user.id).single();
    if (prof && prof.active === false) {
      await supabase.auth.signOut();
      return 'This account has been switched off. Please contact the administration office.';
    }
    if (prof) {
      supabase.from('activity_logs').insert({ user_id: data.user.id, user_name: prof.name, user_role: prof.role, action: 'login' }).then(() => {});
    }
    return null;
  };

  const signup = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { name: name.trim() }, emailRedirectTo: siteUrl() },
    });
    if (error) return { error: friendlyError(error.message) };
    // Supabase hides "already registered" behind an empty identities list
    if (data.user && data.user.identities && data.user.identities.length === 0) return { error: friendlyError('user already registered') };
    return { needsConfirmation: !data.session };
  };

  const logout = () => { supabase.auth.signOut(); setAuthLink(null); };

  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: siteUrl() });
    return error ? friendlyError(error.message) : null;
  };

  const setNewPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return friendlyError(error.message);
    setAuthLink(null);
    try { window.history.replaceState(null, '', siteUrl()); } catch { /* ignore */ }
    return null;
  };

  const changePassword = async (current: string, next: string) => {
    if (!user) return 'Please sign in again.';
    const { error: checkErr } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
    if (checkErr) return 'Your current password is not correct.';
    const { error } = await supabase.auth.updateUser({ password: next });
    return error ? friendlyError(error.message) : null;
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    const { name, bio, profilePicture, hasCompletedPayment, personalDetails } = userData;
    const profilePatch = toRow({ name, bio, profilePicture, hasCompletedPayment });
    if (Object.keys(profilePatch).length) {
      patch('profiles', prev => prev.map(p => (p.id === user.id ? { ...p, ...profilePatch } : p)));
      run(['profiles'], () => supabase.from('profiles').update(profilePatch).eq('id', user.id));
    }
    if (personalDetails) {
      const merged = { ...(user.personalDetails ?? {}), ...personalDetails };
      patch('details', prev => [...prev.filter(d => d.id !== user.id), { id: user.id, personal_details: merged }]);
      run(['details'], () => supabase.from('student_details').upsert({ id: user.id, personal_details: merged, updated_at: now() }));
    }
  };

  const refresh = () => loadEverything();

  /* ---------- Staff accounts ---------- */

  const inviteStaff: AuthContextType['inviteStaff'] = async (inv) => {
    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: { ...inv, redirectTo: siteUrl() },
    });
    if (error) {
      let msg = error.message;
      try { const ctx = (error as { context?: Response }).context; if (ctx) msg = (await ctx.json()).error ?? msg; } catch { /* keep message */ }
      return friendlyError(msg);
    }
    if (data?.error) return friendlyError(data.error);
    await reload(['staffInvites']);
    return null;
  };

  const cancelInvite = (email: string) => {
    patch('staffInvites', prev => prev.filter(i => i.email !== email));
    run(['staffInvites'], () => supabase.from('staff_invites').delete().eq('email', email));
  };

  const updateAccount: AuthContextType['updateAccount'] = (userId, updates) => {
    const row = toRow(updates);
    patch('profiles', prev => prev.map(p => (p.id === userId ? { ...p, ...row } : p)));
    run(['profiles'], () => supabase.from('profiles').update(row).eq('id', userId));
  };

  /* ---------- Courses, timetable, live classes ---------- */

  const addCourse = (course: Omit<Course, 'id'>) => {
    const item = { ...course, lecturerId: course.lecturerId || undefined, id: newId() } as Course;
    patch('courses', prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
    run(['courses'], () => supabase.from('courses').insert(toRow(item)));
  };
  const updateCourse = (id: string, updates: Partial<Course>) => {
    const row = toRow(updates, ['id']);
    if ('lecturerId' in updates && !updates.lecturerId) row.lecturer_id = null;
    if ('imageUrl' in updates && !updates.imageUrl) row.image_url = null;
    patch('courses', prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    run(['courses'], () => supabase.from('courses').update(row).eq('id', id));
  };
  const deleteCourse = (id: string) => {
    patch('courses', prev => prev.filter(c => c.id !== id));
    run(['courses'], () => supabase.from('courses').delete().eq('id', id));
  };

  const addTimetableEntry = (e: Omit<TimetableEntry, 'id'>) => {
    const item = { ...e, id: newId() };
    patch('timetable', prev => [...prev, item]);
    run(['timetable'], () => supabase.from('timetable').insert(toRow(item)));
  };
  const updateTimetableEntry = (id: string, u: Partial<TimetableEntry>) => {
    patch('timetable', prev => prev.map(t => (t.id === id ? { ...t, ...u } : t)));
    run(['timetable'], () => supabase.from('timetable').update(toRow(u, ['id'])).eq('id', id));
  };
  const deleteTimetableEntry = (id: string) => {
    patch('timetable', prev => prev.filter(t => t.id !== id));
    run(['timetable'], () => supabase.from('timetable').delete().eq('id', id));
  };

  const addLiveClass = (lc: Omit<LiveClass, 'id'>) => {
    const item = { ...lc, id: newId() };
    patch('liveClasses', prev => [item, ...prev]);
    run(['liveClasses'], () => supabase.from('live_classes').insert(toRow(item)));
    addNotification({ type: 'live_class_scheduled', title: 'Live class scheduled', message: `${lc.courseName}: ${new Date(lc.scheduledTime).toLocaleString()}.`, timestamp: now(), isRead: false, courseId: lc.courseId, relatedId: item.id, recipientRole: 'student' });
  };
  const deleteLiveClass = (id: string) => {
    patch('liveClasses', prev => prev.filter(c => c.id !== id));
    run(['liveClasses'], () => supabase.from('live_classes').delete().eq('id', id));
  };
  const updateLiveClass = (id: string, updates: Partial<LiveClass>) => {
    const info = store.liveClasses.find(c => c.id === id);
    patch('liveClasses', prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    run(['liveClasses'], () => supabase.from('live_classes').update(toRow(updates, ['id'])).eq('id', id));
    if (updates.isLive === true && info && user) {
      logActivity({ userId: user.id, userName: user.name, userRole: 'lecturer', action: 'taught_class', details: info.courseName });
      addNotification({ type: 'live_class_started', title: 'Live class started', message: `${info.courseName} is live now. Join from Live classes.`, timestamp: now(), isRead: false, courseId: info.courseId, relatedId: id, recipientRole: 'student' });
    }
  };

  const enrollInCourse = (courseId: string, type: Enrollment['type'] = 'full-time', paymentPlan: Enrollment['paymentPlan'] = 'full') => {
    if (!user || user.role !== 'student' || user.courses.includes(courseId)) return;
    const course = store.courses.find(c => c.id === courseId);
    const row = { id: newId(), student_id: user.id, course_id: courseId, type, payment_plan: paymentPlan, total_amount: course?.price ?? 0, amount_paid: 0, enrolled_at: now() };
    patch('enrollments', prev => [...prev, row]);
    run(['enrollments'], () => supabase.from('enrollments').insert({ id: row.id, student_id: user.id, course_id: courseId, type, payment_plan: paymentPlan }));
    logActivity({ userId: user.id, userName: user.name, userRole: 'student', action: 'join_class', details: `Enrolled in ${course?.name} (${type})` });
  };

  /* ---------- Notifications ---------- */

  const markRead = (ids: string[]) => {
    if (!user) return;
    const already = new Set(store.reads.filter(r => r.user_id === user.id).map(r => r.notification_id));
    const fresh = ids.filter(id => !already.has(id));
    if (!fresh.length) return;
    const rows = fresh.map(id => ({ notification_id: id, user_id: user.id }));
    patch('reads', prev => [...prev, ...rows]);
    run(['reads'], () => supabase.from('notification_reads').upsert(rows, { ignoreDuplicates: true }), true);
  };
  const markNotificationAsRead = (id: string) => markRead([id]);
  const markAllNotificationsRead = (ids: string[]) => markRead(ids);
  const clearAllNotifications = () => markRead(notifications.map(n => n.id));

  /* ---------- Recordings, assignments ---------- */

  const addRecording = (r: Omit<LectureRecording, 'id'>) => {
    const item = { ...r, id: newId() };
    patch('recordings', prev => [item, ...prev]);
    run(['recordings'], () => supabase.from('recordings').insert(toRow(item)));
    addNotification({ type: 'new_material', title: 'New recording', message: `${r.title} was added to ${r.courseName}.`, timestamp: now(), isRead: false, courseId: r.courseId, recipientRole: 'student' });
  };
  const deleteRecording = (id: string) => {
    patch('recordings', prev => prev.filter(r => r.id !== id));
    run(['recordings'], () => supabase.from('recordings').delete().eq('id', id));
  };

  const addHomework = (h: Omit<Homework, 'id'>) => {
    const item = { ...h, id: newId() };
    patch('homeworks', prev => [item, ...prev]);
    run(['homeworks'], () => supabase.from('homeworks').insert(toRow(item, ['submissions'])));
    addNotification({ type: 'assignment_posted', title: 'New assignment', message: `${h.title} (${h.courseName}) is due ${new Date(h.dueDate).toLocaleDateString()}.`, timestamp: now(), isRead: false, courseId: h.courseId, recipientRole: 'student' });
  };
  const deleteHomework = (id: string) => {
    patch('homeworks', prev => prev.filter(h => h.id !== id));
    patch('homeworkSubmissions', prev => prev.filter(s => s.homeworkId !== id));
    run(['homeworks', 'homeworkSubmissions'], () => supabase.from('homeworks').delete().eq('id', id));
  };

  const submitHomework = (s: Omit<HomeworkSubmission, 'id' | 'submittedAt'>) => {
    const item: HomeworkSubmission = { ...s, id: newId(), submittedAt: now() };
    patch('homeworkSubmissions', prev => [...prev, item]);
    run(['homeworkSubmissions'], () => supabase.from('homework_submissions').insert(toRow(item, ['grade', 'feedback', 'gradedAt'])));
  };

  const gradeSubmission = (submissionId: string, grade: number, feedback?: string) => {
    const sub = store.homeworkSubmissions.find(s => s.id === submissionId);
    const gradedAt = now();
    patch('homeworkSubmissions', prev => prev.map(s => (s.id === submissionId ? { ...s, grade, feedback, gradedAt } : s)));
    run(['homeworkSubmissions'], () => supabase.from('homework_submissions').update({ grade, feedback: feedback ?? null, graded_at: gradedAt }).eq('id', submissionId));
    if (sub) {
      const hw = store.homeworks.find(h => h.id === sub.homeworkId);
      addNotification({ type: 'assignment_graded', title: 'Assignment marked', message: `${hw?.title ?? 'Your assignment'}: ${grade}%.`, timestamp: now(), isRead: false, userId: sub.studentId, recipientRole: 'student' });
    }
  };

  /* ---------- Exams ---------- */

  const addExam = (exam: Omit<Exam, 'id'>) => {
    const id = newId();
    const key: Record<string, string> = {};
    exam.questions.forEach(q => { if (q.correctAnswer) key[q.id] = q.correctAnswer; });
    const publicQuestions = exam.questions.map(({ correctAnswer: _hidden, ...q }) => q);
    patch('exams', prev => [{ ...exam, id, questions: publicQuestions }, ...prev]);
    patch('examKeys', prev => [...prev, { exam_id: id, answers: key }]);
    (async () => {
      const ok = await run(['exams'], () => supabase.from('exams').insert(toRow({ ...exam, id, questions: publicQuestions })));
      if (ok) await run(['examKeys'], () => supabase.rpc('save_exam_key', { exam: id, key }));
    })();
    if (exam.isPublished) {
      addNotification({ type: 'exam_scheduled', title: 'Exam scheduled', message: `${exam.title} (${exam.courseName}) opens ${new Date(exam.scheduledDate).toLocaleString()}.`, timestamp: now(), isRead: false, courseId: exam.courseId, recipientRole: 'student' });
    }
  };
  const updateExam = (id: string, updates: Partial<Exam>) => {
    const { questions: _q, ...rest } = updates;
    const before = store.exams.find(e => e.id === id);
    patch('exams', prev => prev.map(e => (e.id === id ? { ...e, ...rest } : e)));
    run(['exams'], () => supabase.from('exams').update(toRow(rest, ['id'])).eq('id', id));
    if (before && rest.isPublished === true && !before.isPublished) {
      addNotification({ type: 'exam_scheduled', title: 'Exam scheduled', message: `${before.title} (${before.courseName}) opens ${new Date(before.scheduledDate).toLocaleString()}.`, timestamp: now(), isRead: false, courseId: before.courseId, recipientRole: 'student' });
    }
  };
  const deleteExam = (id: string) => {
    patch('exams', prev => prev.filter(e => e.id !== id));
    patch('examAttempts', prev => prev.filter(a => a.examId !== id));
    run(['exams', 'examAttempts'], () => supabase.from('exams').delete().eq('id', id));
  };

  const startExamAttempt = (examId: string, studentId: string, studentName: string): ExamAttempt => {
    const existing = store.examAttempts.find(a => a.examId === examId && a.studentId === studentId);
    if (existing) return existing;
    const attempt: ExamAttempt = { id: newId(), examId, studentId, studentName, startTime: now(), answers: {}, isSubmitted: false };
    patch('examAttempts', prev => [...prev, attempt]);
    run(['examAttempts'], () => supabase.from('exam_attempts').insert({ id: attempt.id, exam_id: examId, student_id: studentId, student_name: studentName, answers: {} }));
    return attempt;
  };

  const updateExamAttempt = (attemptId: string, updates: Partial<ExamAttempt>) => {
    patch('examAttempts', prev => prev.map(a => (a.id === attemptId && !a.isSubmitted ? { ...a, ...updates } : a)));
    if (updates.answers) {
      run(['examAttempts'], () => supabase.from('exam_attempts').update({ answers: updates.answers }).eq('id', attemptId), true);
    }
  };

  const submitExamAttempt = (attemptId: string, isAutoSubmit = false) => {
    const local = store.examAttempts.find(a => a.id === attemptId);
    patch('examAttempts', prev => prev.map(a => (a.id === attemptId ? { ...a, isSubmitted: true, endTime: now(), needsMarking: true } : a)));
    (async () => {
      // Make sure the latest answers are saved before marking
      if (local) await supabase.from('exam_attempts').update({ answers: local.answers }).eq('id', attemptId);
      const { data, error } = await supabase.rpc('submit_exam_attempt', { attempt_id: attemptId, auto_submit: isAutoSubmit });
      if (error) { toast.error(friendlyError(error.message)); await reload(['examAttempts']); return; }
      const marked = fromRow<ExamAttempt>(data as Row);
      patch('examAttempts', prev => prev.map(a => (a.id === attemptId ? marked : a)));
    })();
  };

  const markExamAttempt = (attemptId: string, essayMarks: Record<string, number>, feedback?: string) => {
    const attempt = store.examAttempts.find(a => a.id === attemptId);
    if (!attempt) return;
    const essayTotal = Object.values(essayMarks).reduce((s, m) => s + (Number(m) || 0), 0);
    const updates = { essayMarks, feedback, needsMarking: false, score: (attempt.autoScore ?? 0) + essayTotal, markedAt: now() };
    patch('examAttempts', prev => prev.map(a => (a.id === attemptId ? { ...a, ...updates } : a)));
    run(['examAttempts'], () => supabase.from('exam_attempts').update(toRow(updates)).eq('id', attemptId));
    const exam = store.exams.find(e => e.id === attempt.examId);
    addNotification({ type: 'exam_graded', title: 'Exam results out', message: `${exam?.title ?? 'Your exam'} has been marked. See Exams → Results.`, timestamp: now(), isRead: false, userId: attempt.studentId, recipientRole: 'student' });
  };

  /* ---------- Payments ---------- */

  const submitPayment: AuthContextType['submitPayment'] = (claim) => {
    if (!user) return;
    const item: PaymentClaim = { ...claim, id: newId(), studentId: user.id, studentName: user.name, submittedAt: now(), status: 'pending' };
    patch('paymentClaims', prev => [item, ...prev]);
    run(['paymentClaims'], () => supabase.from('payment_claims').insert(toRow(item, ['status', 'submittedAt'])));
  };

  const reviewPayment = (claimId: string, decision: 'confirmed' | 'rejected', reason?: string) => {
    patch('paymentClaims', prev => prev.map(c => (c.id === claimId ? { ...c, status: decision, reviewedBy: user?.name, reviewedAt: now(), rejectionReason: decision === 'rejected' ? reason : undefined } : c)));
    (async () => {
      const { error } = await supabase.rpc('review_payment', { claim_id: claimId, decision, reason: reason ?? null });
      if (error) toast.error(friendlyError(error.message));
      await reload(['paymentClaims', 'transactions', 'enrollments', 'profiles']);
    })();
  };

  /* ---------- Attendance ---------- */

  const recordAttendance = (liveClassId: string, studentId: string, markedBy: AttendanceRecord['markedBy'] = 'auto') => {
    const lc = store.liveClasses.find(c => c.id === liveClassId);
    const student = users.find(u => u.id === studentId);
    if (!lc || !student) return;
    if (store.attendance.some(a => a.liveClassId === liveClassId && a.studentId === studentId)) return;
    const item: AttendanceRecord = { id: newId(), liveClassId, courseId: lc.courseId, studentId, studentName: student.name, joinedAt: now(), markedBy };
    patch('attendance', prev => [...prev, item]);
    run(['attendance'], () => supabase.from('attendance').upsert(toRow(item), { onConflict: 'live_class_id,student_id', ignoreDuplicates: true }), true);
    if (markedBy === 'auto') logActivity({ userId: studentId, userName: student.name, userRole: 'student', action: 'join_class', details: lc.courseName });
  };
  const removeAttendance = (liveClassId: string, studentId: string) => {
    patch('attendance', prev => prev.filter(a => !(a.liveClassId === liveClassId && a.studentId === studentId)));
    run(['attendance'], () => supabase.from('attendance').delete().eq('live_class_id', liveClassId).eq('student_id', studentId));
  };

  /* ---------- Announcements, certificates ---------- */

  const addAnnouncement: AuthContextType['addAnnouncement'] = (a) => {
    const item: Announcement = { ...a, id: newId(), date: now(), authorName: user?.name ?? 'Administration' };
    patch('announcements', prev => [item, ...prev]);
    run(['announcements'], () => supabase.from('announcements').insert(toRow(item)));
    addNotification({
      type: 'announcement', title: a.title, message: a.content.slice(0, 140), timestamp: item.date, isRead: false,
      courseId: a.audience === 'course' ? a.courseId : undefined,
      recipientRole: a.audience === 'lecturers' ? 'lecturer' : a.audience === 'all' ? 'all' : 'student',
    });
  };
  const deleteAnnouncement = (id: string) => {
    patch('announcements', prev => prev.filter(a => a.id !== id));
    run(['announcements'], () => supabase.from('announcements').delete().eq('id', id));
  };

  const addCertificate = (certificate: Omit<Certificate, 'id'>) => {
    const item = { ...certificate, id: newId() };
    patch('certificates', prev => [...prev, toRow(item)]);
    run(['certificates'], () => supabase.from('certificates').insert(toRow(item)));
  };

  return (
    <AuthContext.Provider
      value={{
        loading, authLink,
        user, users, courses: store.courses, timetable: store.timetable, liveClasses: store.liveClasses, notifications,
        activityLogs: store.activityLogs, recordings: store.recordings, homeworks: store.homeworks, exams,
        homeworkSubmissions: store.homeworkSubmissions, examAttempts: store.examAttempts, paymentClaims: store.paymentClaims,
        attendance: store.attendance, announcements: store.announcements, staffInvites: store.staffInvites,
        login, signup, logout, requestPasswordReset, setNewPassword, changePassword, updateUser, refresh,
        inviteStaff, cancelInvite, updateAccount,
        addCourse, updateCourse, deleteCourse, addTimetableEntry, updateTimetableEntry, deleteTimetableEntry,
        addLiveClass, updateLiveClass, deleteLiveClass, enrollInCourse,
        addNotification, markNotificationAsRead, markAllNotificationsRead, clearAllNotifications, logActivity,
        addRecording, deleteRecording, addHomework, deleteHomework, submitHomework, gradeSubmission,
        addExam, updateExam, deleteExam, startExamAttempt, updateExamAttempt, submitExamAttempt, markExamAttempt,
        submitPayment, reviewPayment, recordAttendance, removeAttendance,
        addAnnouncement, deleteAnnouncement, addCertificate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

/** Notifications a given person should see (the database already filters; this keeps the order and rules consistent). */
export function notificationsFor(all: Notification[], u: User) {
  return all
    .filter(n => {
      if (n.userId) return n.userId === u.id;
      if (u.role === 'student') return (n.recipientRole === 'student' || n.recipientRole === 'all') && (!n.courseId || u.courses.includes(n.courseId));
      if (u.role === 'lecturer') return n.recipientRole === 'lecturer' || n.recipientRole === 'all';
      return n.recipientRole === 'all';
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/** Can this staff member use a given area? Admin can use everything. */
export function staffCan(u: User | null, area: 'payments' | 'people' | 'academics' | 'accounts') {
  if (!u || u.role !== 'staff') return false;
  const r = u.staffRole ?? 'registrar';
  if (r === 'admin') return true;
  if (area === 'payments') return r === 'finance';
  if (area === 'accounts') return false;
  if (area === 'people') return true;
  return r === 'registrar';
}
