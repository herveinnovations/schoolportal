import React, { useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { Logo } from './BrandMark';
import { useSite } from '@/app/context/SiteContext';
import { ArrowLeft, GraduationCap, BookOpen, Shield, Eye, EyeOff, CheckCircle2, Video, ClipboardCheck, Award, Users, BarChart3, KeyRound } from 'lucide-react';
import { Input } from '@/app/components/ui/input';

export type Role = 'student' | 'lecturer' | 'staff';

const ease = [0.22, 1, 0.36, 1] as const;

export type ShellTheme = Role | 'all';

export const roleMeta: Record<ShellTheme, { label: string; icon: React.ReactNode; accent: string; panel: string; points: [React.ReactNode, string][]; heading: string }> = {
  student: {
    label: 'Student', icon: <GraduationCap className="w-4 h-4" />, accent: 'bg-emerald-700', panel: 'from-emerald-800 via-emerald-900 to-stone-900',
    heading: 'Your classes, recordings and results in one place.',
    points: [[<Video className="w-4 h-4" />, 'Join live lectures and ask questions'], [<ClipboardCheck className="w-4 h-4" />, 'Sit timed exams online'], [<Award className="w-4 h-4" />, 'Download your certificates']],
  },
  lecturer: {
    label: 'Lecturer', icon: <BookOpen className="w-4 h-4" />, accent: 'bg-amber-700', panel: 'from-amber-800 via-amber-900 to-stone-900',
    heading: 'Teach live, post work and grade from one portal.',
    points: [[<Video className="w-4 h-4" />, 'Start live classes and take attendance'], [<ClipboardCheck className="w-4 h-4" />, 'Build exams and assignments'], [<Users className="w-4 h-4" />, 'Track every student in your courses']],
  },
  all: {
    label: 'Alphatech', icon: <GraduationCap className="w-4 h-4" />, accent: 'bg-emerald-700', panel: 'from-emerald-800 via-emerald-900 to-stone-900',
    heading: 'One sign-in for students, lecturers and staff.',
    points: [[<Video className="w-4 h-4" />, 'Live classes, recordings and exams'], [<Users className="w-4 h-4" />, 'Marking, attendance and gradebooks'], [<BarChart3 className="w-4 h-4" />, 'Payments, results and administration']],
  },
  staff: {
    label: 'Staff', icon: <Shield className="w-4 h-4" />, accent: 'bg-teal-800', panel: 'from-teal-900 via-stone-800 to-stone-950',
    heading: 'Administration for authorised staff only.',
    points: [[<BarChart3 className="w-4 h-4" />, 'Enrolment, revenue and activity at a glance'], [<BookOpen className="w-4 h-4" />, 'Create courses and assign lecturers'], [<KeyRound className="w-4 h-4" />, 'Issue certificates and announcements']],
  },
};

export const RoleSwitch: React.FC<{ role: Role; onChange: (r: Role) => void }> = ({ role, onChange }) => (
  <div role="tablist" aria-label="Account type" className="grid grid-cols-3 gap-1 p-1 bg-stone-100 rounded-full">
    {(['student', 'lecturer', 'staff'] as Role[]).map(r => (
      <button key={r} type="button" role="tab" aria-selected={role === r} onClick={() => onChange(r)}
        className={`relative flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium transition-colors ${role === r ? 'text-white' : 'text-stone-600 hover:text-stone-900'}`}>
        {role === r && <motion.span layoutId="role-pill" className={`absolute inset-0 rounded-full ${roleMeta[r].accent} shadow-sm`} transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
        <span className="relative flex items-center gap-1.5">{roleMeta[r].icon}{roleMeta[r].label}</span>
      </button>
    ))}
  </div>
);

export const PasswordInput: React.FC<React.ComponentProps<typeof Input>> = (props) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? 'text' : 'password'} className="pr-10" />
      <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 rounded">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};

export const AuthShell: React.FC<{ onHome: () => void; role: ShellTheme; children: React.ReactNode; aside?: React.ReactNode }> = ({ onHome, role, children, aside }) => {
  const meta = roleMeta[role];
  const { images } = useSite();
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-stone-50 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* Brand panel (desktop) */}
        <aside className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 bg-ink text-white">
          <motion.img src={images.signIn} alt="" aria-hidden initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 2.4, ease }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/65" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <button onClick={onHome} className="relative w-fit" aria-label="Alphatech Computer Institute home"><Logo height={52} plate /></button>
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div key={role} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4, ease }}>
                <p className="text-sm font-semibold tracking-[0.2em] text-sun">- {role === 'all' ? 'PORTAL' : meta.label.toUpperCase()} -</p>
                <h2 className="mt-4 font-display font-extrabold text-[30px] xl:text-[38px] leading-[1.1] tracking-[-0.01em] text-balance max-w-lg">{meta.heading}</h2>
                <ul className="mt-9 space-y-4">
                  {meta.points.map(([icon, text], i) => (
                    <motion.li key={text} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                      className="flex items-center gap-4 text-[15px] text-white/90">
                      <span className="w-10 h-10 bg-sun text-ink flex items-center justify-center shrink-0">{icon}</span>{text}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
          <p className="relative text-[13px] text-white/50">© 2026 Alphatech Computer Institute · Computer Literacy is our priority</p>
        </aside>

        {/* Form side */}
        <div className="flex flex-col min-w-0">
          <nav className="h-[76px] px-4 sm:px-8 flex items-center justify-between bg-white lg:bg-transparent border-b border-stone-200 lg:border-0">
            <button onClick={onHome} aria-label="Alphatech Computer Institute home" className="lg:invisible"><Logo height={44} /></button>
            <button onClick={onHome} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-ink/70 hover:text-ink">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> Back to home
            </button>
          </nav>
          <main className="flex-1 flex items-center justify-center px-4 py-10">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="w-full max-w-md">
              <div className="auth-card bg-white border border-stone-200 border-t-4 border-t-sun shadow-[0_30px_60px_-30px_rgba(0,0,0,0.25)] p-6 sm:p-9">{children}</div>
              {aside}
            </motion.div>
          </main>
        </div>
      </div>
    </MotionConfig>
  );
};

export const ErrorNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div role="alert" initial={{ opacity: 0, y: -6, x: 0 }} animate={{ opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }} transition={{ duration: 0.4 }}
    className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-2">
    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
    <span>{children}</span>
  </motion.div>
);

export const SuccessNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-green-700 text-sm bg-green-50 p-3 rounded-lg border border-green-100 flex items-center gap-2">
    <CheckCircle2 className="w-4 h-4 shrink-0" />{children}
  </motion.div>
);

export const Spinner: React.FC = () => <span className="inline-block w-4 h-4 rounded-full border-2 border-current/30 border-t-current animate-spin" aria-hidden />;
