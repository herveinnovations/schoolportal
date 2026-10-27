import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, MotionConfig, useScroll, useSpring } from 'motion/react';
import { useAuth } from '@/app/context/AuthContext';
import { schoolLogo, Logo } from './BrandMark';
import { SCHOOL, FEES } from '@/app/config/school';
import { LEVELS, levelLabel, levelTone, type Level } from '@/app/lib/levels';
import { useSite } from '@/app/context/SiteContext';
import { DocumentRow } from './DocumentsList';
import {
  Video, PlayCircle, ClipboardCheck, MessageSquare, FileText, Wallet, TrendingUp, Clock,
  ArrowRight, ArrowUp, Menu, X, ChevronDown, Phone,
} from 'lucide-react';

type Role = 'student' | 'lecturer' | 'staff';

interface LandingProps {
  onSignIn: (role?: Role) => void;
  onSignUp: (role?: Role) => void;
}

const ease = [0.22, 1, 0.36, 1] as const;
const wrap = 'max-w-[1170px] mx-auto px-5 sm:px-8 xl:px-0';

/** Fades content up as it scrolls in. Starts mostly visible so nothing is hidden before scrolling. */
const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className }) => (
  <motion.div className={className} initial={{ opacity: 0.3, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.7, ease, delay }}>
    {children}
  </motion.div>
);

/** A photo that sits on a solid colour, so the layout still looks right if the image is slow or missing. */
const Photo: React.FC<{ src: string; alt: string; className?: string; zoom?: boolean }> = ({ src, alt, className = '', zoom }) => {
  const [ok, setOk] = useState(true);
  return ok ? (
    <motion.img src={src} alt={alt} loading={zoom ? 'eager' : 'lazy'} onError={() => setOk(false)}
      initial={zoom ? { scale: 1.08 } : false} animate={zoom ? { scale: 1 } : undefined} transition={{ duration: 2.4, ease }}
      className={`w-full h-full object-cover ${className}`} />
  ) : <div role="img" aria-label={alt} className="w-full h-full bg-gradient-to-br from-royal to-ink" />;
};

/** Yellow, square, bold: the main call-to-action style. */
const SunButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { dark?: boolean }> = ({ dark, className = '', children, ...p }) => (
  <button {...p} className={`group inline-flex items-center justify-center gap-3 h-14 px-8 text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${dark ? 'bg-ink text-white hover:bg-black focus-visible:outline-ink' : 'bg-sun text-ink hover:bg-sun-deep focus-visible:outline-sun'} ${className}`}>
    {children}
  </button>
);

/** "- 01 -" style section heading with a big display title. */
const Numbered: React.FC<{ n: string; title: React.ReactNode; light?: boolean; children?: React.ReactNode }> = ({ n, title, light, children }) => (
  <Reveal>
    <p className={`text-sm font-semibold tracking-[0.2em] ${light ? 'text-white/60' : 'text-ink/60'}`}>- {n} -</p>
    <h2 className={`mt-3 font-display font-extrabold text-[30px] sm:text-[38px] lg:text-[44px] leading-[1.1] tracking-[-0.01em] text-balance ${light ? 'text-white' : 'text-ink'}`}>{title}</h2>
    {children}
  </Reveal>
);

/* ---------- FAQ ---------- */
const faqs = [
  { q: 'What do I need to register?', a: `Your full names, date of birth, cell number, residential address and email, plus your NRC number if you have one. You choose your mode of study and the courses you want, and pay the K${FEES.registration} admission form fee. Other requirements are given in your Acceptance Letter.` },
  { q: 'Can I pay course fees in instalments?', a: `Yes. When you enrol you choose full payment, 3 monthly instalments or 6 monthly instalments. The registration fee of K${FEES.registration} is paid once, in full.` },
  { q: 'How do I pay?', a: 'By MTN Money, Airtel Money, bank deposit or cash at the office. You enter the transaction reference in the portal and our Finance office confirms it, usually within one working day.' },
  { q: 'What if I miss a live class?', a: 'Lecturers add recordings to your course, so you can watch them any time before your exams.' },
  { q: 'How do exams work?', a: 'Exams open at their scheduled time and have a countdown. Your answers save as you go, and the exam submits itself when the time runs out. Multiple-choice answers are marked straight away.' },
  { q: 'Can I study part-time?', a: 'Yes. You choose full-time or part-time for each course you enrol in.' },
];

const FaqItem: React.FC<{ q: string; a: string; open: boolean; onToggle: () => void; id: string }> = ({ q, a, open, onToggle, id }) => (
  <div className="border-b border-stone-200">
    <button id={`${id}-btn`} aria-expanded={open} aria-controls={`${id}-panel`} onClick={onToggle}
      className="w-full flex items-center justify-between gap-6 py-6 text-left font-display font-bold text-[17px] text-ink hover:text-royal focus-visible:outline-2 focus-visible:outline-royal">
      {q}
      <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className={`shrink-0 w-9 h-9 flex items-center justify-center ${open ? 'bg-sun text-ink' : 'bg-stone-100 text-ink/60'}`}><ChevronDown className="w-5 h-5" /></motion.span>
    </button>
    <AnimatePresence initial={false}>
      {open && (
        <motion.div id={`${id}-panel`} role="region" aria-labelledby={`${id}-btn`}
          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease }} className="overflow-hidden">
          <p className="pb-6 text-stone-500 text-[15px] leading-[1.7] max-w-[68ch]">{a}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

/* ---------- Page ---------- */
export const Landing: React.FC<LandingProps> = ({ onSignIn, onSignUp }) => {
  const { courses } = useAuth();
  const { images, text, contact, documents } = useSite();
  const publicDocs = documents.filter(d => d.audience === 'public');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [filter, setFilter] = useState<'all' | Level>('all');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 900);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    { icon: Video, title: 'Live classes', text: 'Join lectures in real time on Zoom, Google Meet or Jitsi, straight from your portal. Your attendance is recorded.' },
    { icon: PlayCircle, title: 'Lecture recordings', text: 'Missed a class? Recordings are added to your course so you can revise any time.' },
    { icon: FileText, title: 'Assignments with feedback', text: 'Submit work online and see your mark and your lecturer’s comments.' },
    { icon: Clock, title: 'Exams with a real timer', text: 'Multiple choice, true/false, short answer and essay. It submits itself when time runs out.' },
    { icon: Wallet, title: 'Pay in instalments', text: 'Pay a course fee in full, or spread it over 3 or 6 months by Mobile Money, bank or cash.' },
    { icon: TrendingUp, title: 'Results and certificates', text: 'Track your marks and progress, and get your certificate when you pass.' },
  ];

  const steps = [
    { title: 'Create your account', text: 'Sign up with your name, email and a password, then confirm your email.' },
    { title: 'Pay the registration fee', text: `A once-off K${FEES.registration}. Finance confirms it and issues your student number.` },
    { title: 'Complete registration', text: 'NRC or passport, contact details, guardian and education history.' },
    { title: 'Enrol and start', text: 'Choose a course, full-time or part-time, and a payment plan. Then join your first class.' },
  ];

  const shownCourses = courses.filter(c => filter === 'all' || (c.level ?? 'beginner') === filter);

  const navLinks: [string, string][] = [['#about', 'About Us'], ['#courses', 'Courses'], ['#how', 'How to Join'], ['#fees', 'Fees'], ['#faq', 'FAQ']];

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-white text-ink font-sans antialiased">
        <motion.div style={{ scaleX: progress }} className="fixed top-0 left-0 right-0 h-[3px] bg-sun origin-left z-[60]" />

        {/* ---------- Top bar ---------- */}
        <nav className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.35)]">
          <div className={`${wrap} h-[76px] lg:h-[90px] flex items-center justify-between gap-4`}>
            <a href="#top" onClick={() => setMenuOpen(false)} className="shrink-0" aria-label={`${SCHOOL.name} home`}>
              <span className="lg:hidden"><Logo height={44} /></span>
              <span className="hidden lg:inline-flex"><Logo height={56} /></span>
            </a>
            <div className="hidden lg:flex items-center gap-10">
              {navLinks.map(([h, l]) => (
                <a key={h} href={h} className="relative text-[15px] font-semibold text-ink/80 hover:text-navy transition-colors after:absolute after:left-0 after:-bottom-1.5 after:h-[3px] after:w-0 after:bg-sun after:transition-all hover:after:w-full">{l}</a>
              ))}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => onSignIn()} className="hidden sm:inline-flex h-11 items-center px-4 text-[15px] font-semibold text-ink hover:text-navy transition-colors">Sign In</button>
              <button onClick={() => onSignUp()} className="hidden sm:inline-flex h-11 items-center px-6 bg-sun hover:bg-sun-deep text-ink text-[15px] font-semibold transition-colors">Apply Now</button>
              <button className="lg:hidden w-11 h-11 flex items-center justify-center bg-ink text-white" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <AnimatePresence>
            {menuOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.3, ease }} className="lg:hidden overflow-hidden bg-white border-t border-stone-200">
                <div className={`${wrap} py-4 flex flex-col`}>
                  {navLinks.map(([h, l]) => (
                    <a key={h} href={h} onClick={() => setMenuOpen(false)} className="py-3.5 text-ink text-[16px] font-semibold border-b border-stone-100">{l}</a>
                  ))}
                  <div className="grid grid-cols-2 gap-3 pt-5">
                    <button onClick={() => onSignIn()} className="h-12 border border-ink/25 text-ink font-semibold">Sign In</button>
                    <button onClick={() => onSignUp()} className="h-12 bg-sun text-ink font-semibold">Apply Now</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* ---------- Hero ---------- */}
        <section id="top" className="relative overflow-hidden bg-ink">
          <div className="absolute inset-0"><Photo src={images.hero} alt="" zoom /></div>
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />
          <div className={`relative ${wrap} min-h-[600px] sm:min-h-[700px] lg:min-h-[872px] flex flex-col justify-center py-24`}>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.15 }}
              className="max-w-[880px] font-display font-extrabold text-white text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.12] tracking-[-0.01em] text-balance">
              {text.heroTitle}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.35 }}
              className="mt-7 max-w-[620px] text-[16px] sm:text-[17px] leading-[1.6] text-white/85">
              {text.heroSubtitle}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.5 }}
              className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
              <SunButton onClick={() => onSignUp()}>Apply Now <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></SunButton>
              {contact.phone ? (
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-3 text-white text-[15px] font-semibold hover:text-sun transition-colors">
                  <Phone className="w-5 h-5" fill="currentColor" strokeWidth={0} />{contact.phone}
                </a>
              ) : (
                <a href="#courses" className="text-white font-semibold underline underline-offset-4 hover:text-sun">Browse courses</a>
              )}
            </motion.div>
          </div>
        </section>

        {/* ---------- Three tiles ---------- */}
        <section className="pt-20 sm:pt-28 lg:pt-[140px]">
          <div className={`${wrap} grid md:grid-cols-3 gap-[30px]`}>
            <Reveal className="bg-royal text-white p-10 min-h-[280px] lg:min-h-[300px] flex flex-col">
              <h3 className="font-display font-extrabold text-[28px] lg:text-[30px] leading-[1.15]">Our Courses</h3>
              <p className="mt-4 text-[15px] leading-[1.55] text-white/90">From your first computer lesson to TEVETA Level 3. Pick a course and we’ll take you through it step by step.</p>
              <SunButton className="mt-auto self-start" onClick={() => document.getElementById('courses')?.scrollIntoView()}>Learn More <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></SunButton>
            </Reveal>
            <Reveal delay={0.08} className="bg-sun text-ink p-10 min-h-[280px] lg:min-h-[300px] flex flex-col">
              <h3 className="font-display font-extrabold text-[28px] lg:text-[30px] leading-[1.15]">Study Your Way</h3>
              <p className="mt-4 text-[15px] leading-[1.55] text-ink/80">Join live lectures or catch up on recordings, study full-time or part-time, and pay in monthly instalments.</p>
              <SunButton dark className="mt-auto self-start" onClick={() => document.getElementById('how')?.scrollIntoView()}>Learn More <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></SunButton>
            </Reveal>
            <Reveal delay={0.16} className="min-h-[300px] md:min-h-0 bg-stone-200 overflow-hidden">
              <Photo src={images.tile} alt="A student working on a laptop" className="transition-transform duration-700 hover:scale-105" />
            </Reveal>
          </div>
        </section>

        {/* ---------- 01 About ---------- */}
        <section id="about" className="pt-16 lg:pt-[72px] scroll-mt-24">
          <div className={`${wrap} grid lg:grid-cols-[370px_minmax(0,1fr)] gap-x-[30px] gap-y-8`}>
            <Numbered n="01" title={<>About<br className="hidden lg:block" /> Alphatech</>}>
              <a href="#faq" className="inline-block mt-6 text-[15px] font-semibold text-sun-deep underline underline-offset-4 decoration-2 hover:text-ink">More About Us</a>
            </Numbered>
            <Reveal delay={0.1} className="lg:pt-10 space-y-5 text-[15px] leading-[1.7] text-stone-500">
              <p className="text-[17px] font-semibold leading-[1.55] text-ink/80">{text.aboutLead}</p>
              <p>{text.aboutBody1}</p>
              <p>{text.aboutBody2}</p>
            </Reveal>
          </div>
          <Reveal className={`${wrap} mt-14 lg:mt-[60px]`}>
            <div className="relative h-[280px] sm:h-[420px] lg:h-[520px] bg-stone-300 overflow-hidden">
              <Photo src={images.band} alt="A class in progress" />
              <div className="absolute left-0 bottom-0 bg-sun text-ink px-6 sm:px-10 py-5 sm:py-7 max-w-[90%]">
                <p className="font-display font-extrabold text-[18px] sm:text-[22px] leading-tight">{SCHOOL.motto}.</p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ---------- 02 Courses ---------- */}
        <section id="courses" className="py-20 lg:py-[120px] scroll-mt-24">
          <div className={wrap}>
            <div className="grid lg:grid-cols-[370px_minmax(0,1fr)] gap-x-[30px] gap-y-6 items-end mb-12">
              <Numbered n="02" title="Courses" />
              <Reveal delay={0.1}>
                <p className="text-[15px] leading-[1.7] text-stone-500 max-w-[60ch]">Courses open for enrolment. Prices are in Zambian Kwacha, and every course can be paid in full or in 3 or 6 monthly instalments.</p>
                {courses.length > 0 && (
                  <div role="tablist" aria-label="Filter by level" className="mt-6 flex flex-wrap gap-2">
                    {([['all', 'All'], ...LEVELS.filter(lv => courses.some(c => (c.level ?? 'beginner') === lv.id)).map(lv => [lv.id, lv.label])] as [string, string][]).map(([v, l]) => (
                      <button key={v} role="tab" aria-selected={filter === v} onClick={() => setFilter(v as 'all' | Level)}
                        className={`h-10 px-5 text-[14px] font-semibold transition-colors ${filter === v ? 'bg-ink text-white' : 'bg-stone-100 text-ink/70 hover:bg-stone-200'}`}>{l}</button>
                    ))}
                  </div>
                )}
              </Reveal>
            </div>

            {courses.length === 0 ? (
              <Reveal className="bg-stone-50 border-l-4 border-sun p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <p className="font-display font-extrabold text-[20px] text-ink">The course list is being prepared</p>
                  <p className="mt-2 text-stone-500 text-[15px]">Courses for the next intake will be listed here soon. Create your account now so you’re ready to enrol.</p>
                </div>
                <SunButton onClick={() => onSignUp()} className="shrink-0">Apply Now <ArrowRight className="w-4 h-4" /></SunButton>
              </Reveal>
            ) : (
              <>
                <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[30px]">
                  <AnimatePresence mode="popLayout">
                    {shownCourses.map((c, i) => (
                      <motion.article key={c.id} layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.45, ease, delay: i * 0.05 }} whileHover={{ y: -6 }}
                        className="group bg-white border border-stone-200 hover:border-ink hover:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.35)] transition-[box-shadow,border-color] flex flex-col">
                        {c.imageUrl ? <div className="h-44 overflow-hidden"><img src={c.imageUrl} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" /></div> : null}
                        <div className="p-8 flex flex-col flex-1">
                          <span className={`self-start px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] ${levelTone(c.level)}`}>{levelLabel(c.level)}</span>
                          <h3 className="mt-5 font-display font-extrabold text-[20px] leading-[1.2] text-ink">{c.name}</h3>
                          <p className="mt-1 text-[14px] text-stone-400">{c.lecturerName} · {c.credits} credits</p>
                          <p className="mt-4 text-[15px] leading-[1.65] text-stone-500 line-clamp-3 flex-1">{c.description}</p>
                          <div className="mt-6 pt-6 border-t border-stone-200 flex items-end justify-between gap-4">
                            <div>
                              <p className="font-display font-extrabold text-[22px] text-ink tabular-nums leading-none">K {Number(c.price).toLocaleString()}</p>
                              <p className="mt-1.5 text-[13px] text-stone-400 tabular-nums">or K {Math.round(c.price / 3).toLocaleString()} × 3 months</p>
                            </div>
                            <button onClick={() => onSignUp()} aria-label={`Apply for ${c.name}`} className="w-12 h-12 bg-sun group-hover:bg-ink group-hover:text-white text-ink flex items-center justify-center transition-colors">
                              <ArrowRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </AnimatePresence>
                </motion.div>
                {shownCourses.length === 0 && <p className="text-stone-500 mt-6">No courses at this level yet.</p>}
              </>
            )}
          </div>
        </section>

        {/* ---------- 03 What you get ---------- */}
        <section className="bg-ink py-20 lg:py-[120px]">
          <div className={wrap}>
            <div className="grid lg:grid-cols-[370px_minmax(0,1fr)] gap-x-[30px] gap-y-6 items-end mb-14">
              <Numbered n="03" light title="What You Get" />
              <Reveal delay={0.1}><p className="text-[15px] leading-[1.7] text-white/60 max-w-[60ch]">Everything a student needs, from the first lecture to the final certificate, in one account.</p></Reveal>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
              {features.map((f, i) => (
                <Reveal key={f.title} delay={(i % 3) * 0.08} className="bg-ink p-8 lg:p-10 group hover:bg-ink-soft transition-colors">
                  <span className="w-14 h-14 bg-sun text-ink flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-1"><f.icon className="w-6 h-6" /></span>
                  <h3 className="mt-6 font-display font-bold text-[18px] text-white">{f.title}</h3>
                  <p className="mt-2.5 text-[15px] leading-[1.65] text-white/60">{f.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- 04 How to join ---------- */}
        <section id="how" className="py-20 lg:py-[120px] scroll-mt-24">
          <div className={wrap}>
            <div className="grid lg:grid-cols-[370px_minmax(0,1fr)] gap-x-[30px] gap-y-6 items-end mb-14">
              <Numbered n="04" title="How to Join" />
              <Reveal delay={0.1}><p className="text-[15px] leading-[1.7] text-stone-500 max-w-[60ch]">Four steps, in this order, from sign-up to your first class.</p></Reveal>
            </div>
            <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-[30px]">
              {steps.map((s, i) => (
                <Reveal key={s.title} delay={i * 0.1}>
                  <li className="list-none h-full border-t-4 border-ink pt-7">
                    <span className="font-display font-extrabold text-[44px] leading-none text-sun">{String(i + 1).padStart(2, '0')}</span>
                    <p className="mt-5 font-display font-bold text-[18px] text-ink">{s.title}</p>
                    <p className="mt-2.5 text-[15px] leading-[1.65] text-stone-500">{s.text}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
            <Reveal className="mt-14"><SunButton onClick={() => onSignUp()}>Start Your Application <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></SunButton></Reveal>
          </div>
        </section>

        {/* ---------- 05 Fees ---------- */}
        <section id="fees" className="bg-stone-50 py-20 lg:py-[120px] scroll-mt-24">
          <div className={`${wrap} grid lg:grid-cols-[370px_minmax(0,1fr)] gap-x-[30px] gap-y-10`}>
            <Numbered n="05" title="Fees">
              <p className="mt-5 text-[15px] leading-[1.7] text-stone-500">What you pay, and when. Pay by MTN Money, Airtel Money, bank deposit or cash at the office.</p>
            </Numbered>
            <Reveal delay={0.1} className="bg-white border border-stone-200 overflow-x-auto">
              <table className="w-full text-[15px] min-w-[520px]">
                <thead className="bg-ink text-white">
                  <tr>
                    <th scope="col" className="text-left font-semibold px-7 py-5">Fee</th>
                    <th scope="col" className="text-left font-semibold px-7 py-5">Amount</th>
                    <th scope="col" className="text-left font-semibold px-7 py-5">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 tabular-nums">
                  <tr><td className="px-7 py-5 font-semibold">Registration</td><td className="px-7 py-5 font-display font-extrabold text-[17px]">K {FEES.registration}</td><td className="px-7 py-5 text-stone-500">Once, after you create your account</td></tr>
                  <tr><td className="px-7 py-5 font-semibold">Course fee</td><td className="px-7 py-5 font-display font-extrabold text-[17px]">Per course</td><td className="px-7 py-5 text-stone-500">At enrolment: in full, or 3 or 6 monthly instalments</td></tr>
                  <tr><td className="px-7 py-5 font-semibold">Certificate</td><td className="px-7 py-5 font-display font-extrabold text-[17px]">K {FEES.certificate}</td><td className="px-7 py-5 text-stone-500">After you pass the course ({FEES.passMark}% or more)</td></tr>
                </tbody>
              </table>
            </Reveal>
          </div>
        </section>

        {/* ---------- 06 FAQ ---------- */}
        <section id="faq" className="py-20 lg:py-[120px] scroll-mt-24">
          <div className={`${wrap} grid lg:grid-cols-[370px_minmax(0,1fr)] gap-x-[30px] gap-y-8`}>
            <Numbered n="06" title={<>Questions<br className="hidden lg:block" /> &amp; Answers</>}>
              <p className="mt-5 text-[15px] leading-[1.7] text-stone-500">What new students ask most. Can’t find your answer? Call us{contact.phone ? ` on ${contact.phone}` : ''}.</p>
            </Numbered>
            <Reveal delay={0.1} className="border-t border-stone-200">
              {faqs.map((f, i) => (
                <FaqItem key={f.q} id={`faq-${i}`} q={f.q} a={f.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
              ))}
            </Reveal>
          </div>
        </section>

        {/* ---------- Downloads (files staff marked for everyone) ---------- */}
        {publicDocs.length > 0 && (
          <section id="downloads" className="pb-20 lg:pb-[120px] scroll-mt-24">
            <div className={`${wrap} grid lg:grid-cols-[370px_minmax(0,1fr)] gap-x-[30px] gap-y-8`}>
              <Numbered n="07" title="Downloads">
                <p className="mt-5 text-[15px] leading-[1.7] text-stone-500">Prospectus, forms and other documents from the school.</p>
              </Numbered>
              <Reveal delay={0.1} className="border border-stone-200 divide-y divide-stone-100">
                {publicDocs.map(d => <DocumentRow key={d.id} doc={d} showAudience={false} />)}
              </Reveal>
            </div>
          </section>
        )}

        {/* ---------- Call to action ---------- */}
        <section className="bg-sun">
          <div className={`${wrap} py-16 lg:py-20 flex flex-col lg:flex-row lg:items-center justify-between gap-8`}>
            <Reveal>
              <h2 className="font-display font-extrabold text-[28px] sm:text-[34px] leading-[1.12] text-ink text-balance max-w-[720px]">Ready to start your registration?</h2>
              <p className="mt-3 text-[16px] text-ink/75">It takes a few minutes. Have your NRC or passport number ready.</p>
            </Reveal>
            <Reveal delay={0.1} className="shrink-0"><SunButton dark onClick={() => onSignUp()}>Apply Now <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></SunButton></Reveal>
          </div>
        </section>

        {/* ---------- Footer ---------- */}
        <footer className="bg-ink text-white/70">
          <div className={`${wrap} py-16 grid sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10`}>
            <div>
              <p className="font-display font-extrabold text-white text-[20px] leading-tight">{SCHOOL.name}</p>
              <p className="mt-2 text-[15px] font-semibold text-sun">{SCHOOL.motto}</p>
              <button onClick={() => onSignUp()} className="group mt-6 inline-flex items-center gap-3 h-12 px-6 bg-sun hover:bg-white text-ink text-[15px] font-semibold transition-colors">
                Apply Now <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
            <div>
              <p className="font-display font-bold text-white text-[16px] mb-4">Students</p>
              <ul className="space-y-2.5 text-[15px]">
                <li><button onClick={() => onSignUp()} className="text-[15px] font-normal hover:text-sun transition-colors">Apply now</button></li>
                <li><button onClick={() => onSignIn()} className="text-[15px] font-normal hover:text-sun transition-colors">Sign in</button></li>
                <li><a href="#courses" className="hover:text-sun transition-colors">Courses</a></li>
                <li><a href="#fees" className="hover:text-sun transition-colors">Fees</a></li>
              </ul>
            </div>
            <div>
              <p className="font-display font-bold text-white text-[16px] mb-4">Lecturers &amp; staff</p>
              <ul className="space-y-2.5 text-[15px]">
                <li><button onClick={() => onSignIn()} className="text-[15px] font-normal hover:text-sun transition-colors">Sign in</button></li>
              </ul>
              <p className="mt-3 text-[13px] text-white/45 leading-relaxed">Use the email address your invitation was sent to.</p>
            </div>
            <div>
              <p className="font-display font-bold text-white text-[16px] mb-4">Contact</p>
              {contact.phone && <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-[15px] hover:text-sun"><Phone className="w-4 h-4" />{contact.phone}</a>}
              {contact.email && <a href={`mailto:${contact.email}`} className="mt-2 block text-[15px] hover:text-sun break-all">{contact.email}</a>}
              {contact.address && <p className="mt-2 text-[15px] leading-[1.55]">{contact.address}</p>}
              <p className="mt-3 text-[13px] text-white/45 leading-relaxed">Payments: MTN Money, Airtel Money, bank deposit or cash at the office.</p>
            </div>
          </div>
          <div className="border-t border-white/10">
            <p className={`${wrap} py-6 text-[13px] text-white/40`}>© {new Date().getFullYear()} {SCHOOL.name}. All rights reserved.</p>
          </div>
        </footer>

        {/* Back to top */}
        <AnimatePresence>
          {showTop && (
            <motion.a href="#top" aria-label="Back to top" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              className="fixed z-50 w-12 h-12 bg-sun hover:bg-ink hover:text-white text-ink shadow-lg flex items-center justify-center transition-colors"
              style={{ right: 'calc(20px + env(safe-area-inset-right, 0px))', bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}>
              <ArrowUp className="w-5 h-5" />
            </motion.a>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
};
