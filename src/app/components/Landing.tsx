import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, MotionConfig, useScroll, useSpring } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from '@/app/context/AuthContext';
import { BrandMark } from './BrandMark';
import {
  Video, PlayCircle, ClipboardCheck, Award, MessageSquare, FileText, Wallet, CheckCircle2,
  Smartphone, TrendingUp, Shield, BookOpen, ArrowRight, ArrowUp, GraduationCap, Users, Clock, Hand, Menu, X,
  ChevronDown, Sparkles, Mic, Signal,
} from 'lucide-react';

type Role = 'student' | 'lecturer' | 'staff';

interface LandingProps {
  onSignIn: (role?: Role) => void;
  onSignUp: (role?: Role) => void;
}

const heroImage = "https://images.unsplash.com/photo-1718327453695-4d32b94c90a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600";
const ease = [0.22, 1, 0.36, 1] as const;

/** Fades content up as it scrolls in. Starts mostly visible so nothing is hidden before scrolling. */
const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0.35, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.6, ease, delay }}
  >
    {children}
  </motion.div>
);

const SectionHeading: React.FC<{ icon: React.ReactNode; eyebrow: string; title: string; sub: string }> = ({ icon, eyebrow, title, sub }) => (
  <Reveal className="text-center mb-10">
    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">{icon}</div>
    <p className="text-xs font-semibold tracking-[0.14em] uppercase text-emerald-700">{eyebrow}</p>
    <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-stone-900 text-balance">{title}</h2>
    <p className="text-stone-500 mt-2 max-w-xl mx-auto">{sub}</p>
  </Reveal>
);

/* ---------- Hero live-class card: cycles chat messages like a real session ---------- */
const chatScript = [
  { who: 'Chanda', text: 'Sir, is 255.255.255.0 the same as /24?' },
  { who: 'Mr. Banda', text: 'Yes. 24 network bits, 254 usable hosts.', lecturer: true },
  { who: 'Thandiwe', text: 'Raised hand ✋' },
  { who: 'Mutale', text: 'Will this be in Quiz 1?' },
  { who: 'Mr. Banda', text: 'It will. Revise the recording tonight.', lecturer: true },
];

const LiveCard: React.FC = () => {
  const [count, setCount] = useState(2);
  const [viewers, setViewers] = useState(23);
  useEffect(() => {
    const t = setInterval(() => {
      setCount(c => (c >= chatScript.length ? 1 : c + 1));
      setViewers(v => v + (Math.random() > 0.5 ? 1 : 0));
    }, 2200);
    return () => clearInterval(t);
  }, []);
  const shown = chatScript.slice(Math.max(0, count - 3), count);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: 1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.9, ease, delay: 0.35 }}
      className="relative"
    >
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="bg-stone-800/85 backdrop-blur border border-white/10 rounded-2xl p-4 shadow-2xl shadow-emerald-950/50 w-full max-w-md ml-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="min-w-0">
            <p className="text-white font-semibold truncate">Computer Networking Fundamentals</p>
            <p className="text-stone-400 text-xs">Example live class · Week 2</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold bg-red-600 text-white pl-1.5 pr-2 py-0.5 rounded shrink-0">
            <span className="relative flex w-2 h-2"><span className="absolute inset-0 rounded-full bg-white animate-ping opacity-75" /><span className="relative w-2 h-2 rounded-full bg-white" /></span>
            LIVE
          </span>
        </div>
        <div className="aspect-video rounded-xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '18px 18px' }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <p className="font-mono text-2xl sm:text-3xl font-semibold tracking-wide">192.168.10.0/24</p>
            <p className="text-emerald-100 text-xs mt-1">Subnet mask 255.255.255.0</p>
          </div>
          <span className="absolute bottom-2 left-2 text-[11px] bg-black/60 text-white px-2 py-0.5 rounded flex items-center gap-1"><Mic className="w-3 h-3 text-green-400" />Mr. Banda</span>
          <span className="absolute top-2 right-2 text-[11px] bg-black/50 text-white px-2 py-0.5 rounded flex items-center gap-1 tabular-nums"><Users className="w-3 h-3" />{viewers}</span>
        </div>
        <div className="mt-3 h-[104px] overflow-hidden flex flex-col justify-end gap-1.5">
          <AnimatePresence initial={false}>
            {shown.map((m, i) => (
              <motion.div key={`${count}-${m.text}`} layout
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease }}
                className={`text-xs rounded-lg px-2.5 py-1.5 w-fit max-w-[90%] ${m.lecturer ? 'bg-emerald-700/90 text-white self-end' : 'bg-stone-700/80 text-stone-100'}`}>
                <span className="font-semibold mr-1">{m.who}:</span>{m.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[['Chat', MessageSquare], ['Q&A', FileText], ['Raise hand', Hand]].map(([t, Icon]: any) => (
            <div key={t} className="flex items-center justify-center gap-1.5 text-xs text-stone-200 bg-stone-700/70 rounded-lg py-2"><Icon className="w-3.5 h-3.5" />{t}</div>
          ))}
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.1, duration: 0.5, ease }}
        className="absolute -left-6 bottom-10 bg-white rounded-xl shadow-xl px-3 py-2 flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></span>
        <div><p className="text-xs font-semibold text-stone-900">Attendance captured</p><p className="text-[11px] text-stone-500">23 students present</p></div>
      </motion.div>
    </motion.div>
  );
};

/* ---------- FAQ ---------- */
const faqs = [
  { q: 'What do I need to register?', a: 'An email address, your NRC number (or passport if you are not Zambian), a phone number, details of a guardian or next of kin, and your last school attended.' },
  { q: 'Can I pay course fees in instalments?', a: 'Yes. When you enrol you choose full payment, 3 monthly instalments or 6 monthly instalments. The registration fee of K170 is paid once, in full.' },
  { q: 'Which payment methods are accepted?', a: 'MTN Money, Airtel Money, Visa or Mastercard, and bank transfer.' },
  { q: 'What if I miss a live class?', a: 'Recorded lectures are added to your course, so you can watch them any time before your exams.' },
  { q: 'How do exams work?', a: 'Exams open at their scheduled time and have a countdown. Your answers save as you go, and the exam submits itself when the time runs out.' },
  { q: 'Can I study part-time?', a: 'Yes. You choose full-time or part-time for each course you enrol in.' },
];

const FaqItem: React.FC<{ q: string; a: string; open: boolean; onToggle: () => void; id: string }> = ({ q, a, open, onToggle, id }) => (
  <div className="border-b border-stone-200 last:border-0">
    <button id={`${id}-btn`} aria-expanded={open} aria-controls={`${id}-panel`} onClick={onToggle}
      className="w-full flex items-center justify-between gap-4 py-4 text-left font-medium text-stone-900 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-emerald-600 rounded">
      {q}
      <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="shrink-0 text-stone-400"><ChevronDown className="w-5 h-5" /></motion.span>
    </button>
    <AnimatePresence initial={false}>
      {open && (
        <motion.div id={`${id}-panel`} role="region" aria-labelledby={`${id}-btn`}
          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease }} className="overflow-hidden">
          <p className="pb-4 text-stone-600 text-sm leading-relaxed max-w-prose">{a}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

/* ---------- Page ---------- */
export const Landing: React.FC<LandingProps> = ({ onSignIn, onSignUp }) => {
  const { courses } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'beginner' | 'advanced' | 'teveta_level_3'>('all');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 24); setShowTop(window.scrollY > 700); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const pillars = [
    { icon: <Video className="w-6 h-6" />, title: 'Live Classes', text: 'Join lectures in real time' },
    { icon: <PlayCircle className="w-6 h-6" />, title: 'Recordings', text: 'Catch up on missed lessons' },
    { icon: <ClipboardCheck className="w-6 h-6" />, title: 'Timed Exams', text: 'Sit exams online, get results' },
    { icon: <Award className="w-6 h-6" />, title: 'Certificates', text: 'Proof of what you completed' },
  ];

  const features = [
    { icon: <MessageSquare className="w-5 h-5" />, title: 'Chat and Q&A in class', text: 'Ask questions during a live lecture and raise your hand without interrupting.' },
    { icon: <PlayCircle className="w-5 h-5" />, title: 'Lecture recordings', text: 'Every recorded lecture stays in your course so you can revise before exams.' },
    { icon: <FileText className="w-5 h-5" />, title: 'Assignments with feedback', text: 'Submit work online and see your grade and your lecturer’s comments.' },
    { icon: <Clock className="w-5 h-5" />, title: 'Exams with a real timer', text: 'Multiple choice, true/false, short answer and essay. Submits itself when time runs out.' },
    { icon: <Wallet className="w-5 h-5" />, title: 'Pay in instalments', text: 'Pay a course fee in full, or spread it over 3 or 6 monthly instalments.' },
    { icon: <TrendingUp className="w-5 h-5" />, title: 'Results and progress', text: 'See your marks, grade and course progress as soon as your lecturer marks your work.' },
  ];

  const steps = [
    { title: 'Create your account', text: 'Sign up with your name, email and a password.' },
    { title: 'Pay the registration fee', text: 'A once-off K170 fee, then you get your student number.' },
    { title: 'Complete registration', text: 'NRC or passport, contact details, guardian and education history.' },
    { title: 'Enrol in a course', text: 'Choose full-time or part-time and a payment plan, then start learning.' },
  ];

  const ticker = ['MTN Money', 'Airtel Money', 'Bank transfer', 'TEVETA Level 3', 'Live lectures', 'Recorded lessons', 'Timed exams', 'Certificates', 'Full-time or part-time'];

  const levelLabel = (l?: string) => l === 'teveta_level_3' ? 'TEVETA Level 3' : l === 'advanced' ? 'Advanced' : 'Beginner';
  const levelTone = (l?: string) => l === 'teveta_level_3' ? 'from-teal-700 to-emerald-800' : l === 'advanced' ? 'from-stone-700 to-stone-900' : 'from-emerald-600 to-teal-600';
  const shownCourses = courses.filter(c => filter === 'all' || (c.level ?? 'beginner') === filter);

  const navLinks = [['#courses', 'Courses'], ['#how', 'How it works'], ['#fees', 'Fees'], ['#faq', 'FAQ']];

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-white text-stone-900">
        <motion.div style={{ scaleX: progress }} className="fixed top-0 left-0 right-0 h-0.5 bg-emerald-700 origin-left z-[60]" />

        {/* Top bar */}
        <nav className={`sticky top-0 z-50 bg-white/95 backdrop-blur border-b transition-shadow duration-300 ${scrolled ? 'border-stone-200 shadow-md' : 'border-transparent shadow-none'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
            <a href="#top" className="shrink-0" onClick={() => setMenuOpen(false)}><BrandMark withName /></a>
            <div className="hidden md:flex items-center gap-7 text-sm text-stone-600">
              {navLinks.map(([h, l]) => (
                <a key={h} href={h} className="relative py-1 hover:text-emerald-700 after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-emerald-700 after:transition-all hover:after:w-full">{l}</a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onSignIn('staff')} aria-label="Staff Access" className="hidden sm:inline-flex items-center gap-1.5 text-xs text-stone-500 border border-stone-200 rounded-full px-3 py-1.5 hover:border-emerald-300 hover:text-emerald-800 transition">
                <Shield className="w-3.5 h-3.5" /> Staff Access
              </button>
              <button onClick={() => onSignIn()} className="hidden sm:block text-sm font-medium text-stone-700 hover:text-emerald-700 px-2">Sign In</button>
              <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={() => onSignUp()} className="text-sm font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg px-4 py-2 shadow-sm">Get Started</motion.button>
              <button className="md:hidden p-2 -mr-2 text-stone-700" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
          <AnimatePresence>
            {menuOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease }}
                className="md:hidden overflow-hidden border-t border-stone-100 bg-white">
                <div className="px-4 py-3 flex flex-col">
                  {navLinks.map(([h, l]) => (
                    <a key={h} href={h} onClick={() => setMenuOpen(false)} className="py-3 text-stone-800 font-medium border-b border-stone-100">{l}</a>
                  ))}
                  <div className="grid grid-cols-2 gap-2 pt-3">
                    <button onClick={() => onSignIn()} className="py-2.5 rounded-full border border-stone-200 text-sm font-medium">Sign In</button>
                    <button onClick={() => onSignIn('staff')} className="py-2.5 rounded-full border border-stone-200 text-sm font-medium inline-flex items-center justify-center gap-1.5"><Shield className="w-4 h-4" />Staff Access</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Hero */}
        <section id="top" className="relative overflow-hidden bg-emerald-950">
          <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: `url(${heroImage})` }} />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-emerald-950/85 to-emerald-900/40" />
          <motion.div aria-hidden animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -right-32 -top-32 w-[28rem] h-[28rem] rounded-full bg-emerald-500/30 blur-3xl" />
          <motion.div aria-hidden animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute -left-40 bottom-0 w-96 h-96 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
                className="inline-flex items-center gap-2 text-xs font-medium text-emerald-200 bg-emerald-600/15 border border-emerald-400/30 rounded-full px-3 py-1">
                <Sparkles className="w-3.5 h-3.5" /> Registration open for the new intake
              </motion.p>
              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.08] tracking-tight">
                {['Learn it live.', 'Revise it anytime.', 'Get certified.'].map((line, i) => (
                  <motion.span key={line} className={`block ${i === 1 ? 'text-amber-400' : ''}`}
                    initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.1 + i * 0.12 }}>
                    {line}
                  </motion.span>
                ))}
              </h1>
              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.5 }}
                className="mt-6 text-lg text-stone-300 max-w-xl">
                Alphatech Computer Institute is an online college portal for Zambian students. Live lectures, recordings, assignments, timed exams and certificates, all in one account.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.62 }} className="mt-8 flex flex-wrap gap-3">
                <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => onSignUp()}
                  className="group inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-3 rounded-full font-medium shadow-lg shadow-emerald-900/40">
                  Create your account <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </motion.button>
                <motion.a whileHover={{ y: -2 }} href="#courses" className="inline-flex items-center bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-medium border border-white/20">
                  Browse courses
                </motion.a>
              </motion.div>
              <ul className="mt-8 grid grid-cols-1 min-[420px]:grid-cols-2 gap-x-6 gap-y-2 text-sm text-stone-300 max-w-md">
                {['Pay with MTN or Airtel Money', 'Live and recorded lectures', 'Full-time or part-time', 'Certificates on completion'].map((b, i) => (
                  <motion.li key={b} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.75 + i * 0.07, duration: 0.4 }} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />{b}
                  </motion.li>
                ))}
              </ul>
            </div>
            <div className="hidden lg:block"><LiveCard /></div>
          </div>
        </section>

        {/* Ticker */}
        <div className="bg-emerald-950 text-emerald-50/80 border-t border-white/5 overflow-hidden group">
          <div className="flex w-max animate-[marquee_32s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
            {[...ticker, ...ticker].map((t, i) => (
              <span key={i} className="flex items-center gap-3 px-6 py-3 text-sm whitespace-nowrap"><Signal className="w-3.5 h-3.5 text-amber-400" />{t}</span>
            ))}
          </div>
        </div>

        {/* Pillars */}
        <section className="py-12 bg-white border-b border-stone-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.08} className="text-center group">
                <motion.div whileHover={{ y: -4, rotate: -6 }} className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-700 group-hover:text-white transition-colors">{p.icon}</motion.div>
                <p className="font-bold text-stone-800 text-sm">{p.title}</p>
                <p className="text-xs text-stone-500 mt-1">{p.text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Courses */}
        <section id="courses" className="py-16 bg-stone-50 scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeading icon={<BookOpen className="w-6 h-6" />} eyebrow="Programmes" title="Courses" sub="Courses currently open for enrolment. Prices are in Zambian Kwacha." />
            {courses.length === 0 ? (
              <Reveal className="max-w-xl mx-auto bg-white rounded-2xl border-2 border-dashed border-stone-200 p-8 text-center">
                <p className="font-semibold text-stone-800">The course list is being prepared</p>
                <p className="text-sm text-stone-500 mt-1">New courses for the next intake will be listed here soon. Create your account now so you’re ready to enrol.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <button onClick={() => onSignUp()} className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-full text-sm font-medium">Create your account <ArrowRight className="w-4 h-4" /></button>
                </div>
              </Reveal>
            ) : (
              <>
                <div role="tablist" aria-label="Filter by level" className="flex flex-wrap justify-center gap-2 mb-8">
                  {([['all', 'All'], ['beginner', 'Beginner'], ['advanced', 'Advanced'], ['teveta_level_3', 'TEVETA Level 3']] as const).map(([v, l]) => (
                    <button key={v} role="tab" aria-selected={filter === v} onClick={() => setFilter(v)}
                      className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === v ? 'text-white' : 'text-stone-600 hover:text-stone-900 bg-white border border-stone-200'}`}>
                      {filter === v && <motion.span layoutId="course-filter" className="absolute inset-0 rounded-full bg-emerald-700" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                      <span className="relative">{l}</span>
                    </button>
                  ))}
                </div>
                <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <AnimatePresence mode="popLayout">
                    {shownCourses.map((c, i) => (
                      <motion.article key={c.id} layout
                        initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.35, ease, delay: i * 0.04 }}
                        whileHover={{ y: -6 }}
                        className="group bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-emerald-300 transition-[box-shadow,border-color] flex flex-col">
                        <div className={`h-24 bg-gradient-to-br ${levelTone(c.level)} relative overflow-hidden`}>
                          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                          <BookOpen className="absolute right-4 bottom-3 w-12 h-12 text-white/25 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6" />
                          <span className="absolute left-4 top-4 bg-white/90 text-stone-900 text-xs font-semibold px-3 py-1 rounded-full">{levelLabel(c.level)}</span>
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="font-bold text-stone-900 text-lg leading-snug">{c.name}</h3>
                          <p className="text-xs text-stone-500 mt-1">{c.lecturerName} · {c.credits} credits</p>
                          <p className="text-sm text-stone-600 mt-2 line-clamp-3 flex-1">{c.description}</p>
                          <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-stone-900 tabular-nums">K {Number(c.price).toLocaleString()}</p>
                              <p className="text-xs text-stone-500 tabular-nums">or K {Math.round(c.price / 3).toLocaleString()} × 3 months</p>
                            </div>
                            <button onClick={() => onSignUp()} className="text-sm font-medium text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1">
                              Enrol <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </button>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </AnimatePresence>
                </motion.div>
                {shownCourses.length === 0 && <p className="text-center text-sm text-stone-500 mt-6">No courses at this level yet.</p>}
              </>
            )}
          </div>
        </section>

        {/* What you get */}
        <section className="py-16 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeading icon={<GraduationCap className="w-6 h-6" />} eyebrow="Inside the portal" title="What You Get" sub="Everything a student needs from first lecture to final certificate." />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <Reveal key={f.title} delay={(i % 3) * 0.08}>
                  <motion.div whileHover={{ y: -4 }} className="group h-full bg-white rounded-xl p-6 shadow-sm border-2 border-stone-100 hover:border-emerald-300 hover:shadow-lg transition-[border-color,box-shadow]">
                    <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">{f.icon}</div>
                    <h3 className="mt-4 font-bold text-stone-900">{f.title}</h3>
                    <p className="text-sm text-stone-600 mt-1">{f.text}</p>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="py-16 bg-white scroll-mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <SectionHeading icon={<ClipboardCheck className="w-6 h-6" />} eyebrow="Enrolment" title="How Enrolment Works" sub="Four steps, in this order, from sign-up to your first class." />
            <div className="relative">
              <div className="hidden lg:block absolute top-[39px] left-[12%] right-[12%] h-0.5 bg-stone-200" aria-hidden>
                <motion.div className="h-full bg-emerald-700 origin-left" initial={{ scaleX: 0.15 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease }} />
              </div>
              <ol className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {steps.map((s, i) => (
                  <Reveal key={s.title} delay={i * 0.12}>
                    <li className="h-full bg-stone-50 rounded-xl p-6 border border-stone-100 list-none">
                      <span className="w-9 h-9 rounded-full bg-emerald-700 text-white text-sm font-bold flex items-center justify-center ring-4 ring-white">{i + 1}</span>
                      <p className="mt-4 font-bold text-stone-900">{s.title}</p>
                      <p className="text-sm text-stone-600 mt-1">{s.text}</p>
                    </li>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Fees */}
        <section id="fees" className="py-16 bg-stone-50 scroll-mt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <SectionHeading icon={<Wallet className="w-6 h-6" />} eyebrow="Fees" title="Fees at a Glance" sub="What you pay, and when." />
            <Reveal className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead className="bg-emerald-700 text-white">
                  <tr>
                    <th scope="col" className="text-left font-semibold px-5 py-3">Fee</th>
                    <th scope="col" className="text-left font-semibold px-5 py-3">Amount (ZMW)</th>
                    <th scope="col" className="text-left font-semibold px-5 py-3">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 tabular-nums">
                  <tr className="hover:bg-emerald-50/50 transition-colors"><td className="px-5 py-3 font-medium">Registration</td><td className="px-5 py-3">K 170</td><td className="px-5 py-3 text-stone-600">Once, when you create your account</td></tr>
                  <tr className="hover:bg-emerald-50/50 transition-colors"><td className="px-5 py-3 font-medium">Course fee</td><td className="px-5 py-3">Set per course</td><td className="px-5 py-3 text-stone-600">At enrolment: in full, or 3 or 6 monthly instalments</td></tr>
                  <tr className="hover:bg-emerald-50/50 transition-colors"><td className="px-5 py-3 font-medium">Certificate</td><td className="px-5 py-3">K 500</td><td className="px-5 py-3 text-stone-600">After you pass the course exam (50% or more)</td></tr>
                </tbody>
              </table>
            </Reveal>
            <p className="text-xs text-stone-500 text-center mt-3">Accepted: MTN Money, Airtel Money, Visa/Mastercard, bank transfer.</p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 bg-white scroll-mt-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <SectionHeading icon={<MessageSquare className="w-6 h-6" />} eyebrow="Questions" title="Frequently Asked Questions" sub="Answers to what new students ask most." />
            <Reveal className="bg-white rounded-2xl border border-stone-200 shadow-sm px-5 sm:px-6">
              {faqs.map((f, i) => (
                <FaqItem key={f.q} id={`faq-${i}`} q={f.q} a={f.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
              ))}
            </Reveal>
          </div>
        </section>

        {/* Teach */}
        <section className="py-16 bg-gradient-to-r from-emerald-50 to-amber-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Reveal className="bg-white rounded-2xl shadow-md border border-stone-200 p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0"><Users className="w-6 h-6" /></div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-stone-900">Teaching at Alphatech Computer Institute?</h2>
                  <p className="text-stone-600 mt-1 max-w-xl">Lecturers run live classes, post assignments, build exams and grade submissions from the Lecturer Portal. You'll need the access code from administration to create a lecturer account.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                <button onClick={() => onSignIn('lecturer')} className="px-5 py-2.5 rounded-full border border-stone-200 text-sm font-medium hover:bg-stone-50">Lecturer sign in</button>
                <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => onSignUp('lecturer')} className="px-5 py-2.5 rounded-full bg-amber-700 hover:bg-amber-800 text-white text-sm font-medium">Create lecturer account</motion.button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* CTA band */}
        <section className="relative py-14 bg-emerald-700 text-white overflow-hidden">
          <motion.div aria-hidden animate={{ x: ['-10%', '10%', '-10%'] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <Reveal className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-balance">Ready to start your registration?</h2>
            <p className="text-emerald-100 mt-2">It takes a few minutes. Have your NRC or passport number ready.</p>
            <motion.button whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => onSignUp()} className="mt-6 inline-block bg-white text-emerald-700 px-8 py-3 rounded-full font-medium hover:bg-emerald-50 shadow-lg">Create your account</motion.button>
          </Reveal>
        </section>

        {/* Footer */}
        <footer className="bg-stone-900 text-stone-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <BrandMark withName dark />
              <p className="text-sm text-stone-400 mt-3">Online learning portal with live classes, recordings, exams and certificates.</p>
            </div>
            <div>
              <p className="text-white font-semibold mb-3">Students</p>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => onSignIn('student')} className="hover:text-white transition-colors">Student sign in</button></li>
                <li><button onClick={() => onSignUp('student')} className="hover:text-white transition-colors">Create an account</button></li>
                <li><a href="#fees" className="hover:text-white transition-colors">Fees</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-3">Staff</p>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => onSignIn('staff')} className="hover:text-white inline-flex items-center gap-1.5 transition-colors"><Shield className="w-3.5 h-3.5" />Staff Portal</button></li>
                <li><button onClick={() => onSignIn('lecturer')} className="hover:text-white inline-flex items-center gap-1.5 transition-colors"><BookOpen className="w-3.5 h-3.5" />Lecturer Portal</button></li>
              </ul>
              <p className="text-xs text-stone-500 mt-3">Authorised personnel only. New staff accounts need an access code.</p>
            </div>
            <div>
              <p className="text-white font-semibold mb-3">Payments</p>
              <p className="text-sm text-stone-400">MTN Money, Airtel Money, Visa/Mastercard and bank transfer.</p>
            </div>
          </div>
          <div className="border-t border-stone-800">
            <p className="max-w-7xl mx-auto px-4 sm:px-6 py-5 text-xs text-stone-500">© 2026 Alphatech Computer Institute. Computer Literacy is our priority.</p>
          </div>
        </footer>

        {/* Back to top */}
        <AnimatePresence>
          {showTop && (
            <motion.a href="#top" aria-label="Back to top"
              initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 10 }}
              whileHover={{ y: -3 }}
              className="fixed z-50 w-11 h-11 rounded-full bg-emerald-700 text-white shadow-lg flex items-center justify-center"
              style={{ right: 'calc(20px + env(safe-area-inset-right, 0px))', bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}>
              <ArrowUp className="w-5 h-5" />
            </motion.a>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
};
