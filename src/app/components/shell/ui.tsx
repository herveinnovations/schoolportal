import React from 'react';
import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';

/** Page section heading with optional action on the right. */
export const SectionTitle: React.FC<{ title: string; sub?: string; action?: React.ReactNode }> = ({ title, sub, action }) => (
  <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
    <div className="min-w-0">
      <h2 className="font-display font-extrabold text-[22px] sm:text-[26px] leading-tight tracking-[-0.01em] text-ink">{title}</h2>
      {sub && <p className="mt-1 text-[15px] text-stone-500">{sub}</p>}
    </div>
    {action}
  </div>
);

/** Friendly empty state with one clear action. */
export const EmptyState: React.FC<{ icon: LucideIcon; title: string; text: string; action?: React.ReactNode }> = ({ icon: Icon, title, text, action }) => (
  <div className="border border-stone-200 border-l-4 border-l-sun bg-white px-6 py-12 text-center">
    <div className="w-14 h-14 mx-auto bg-sun text-ink flex items-center justify-center mb-4"><Icon className="w-7 h-7" /></div>
    <p className="font-display font-extrabold text-[19px] text-ink">{title}</p>
    <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">{text}</p>
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

/** Small stat tile. */
export const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: string; icon?: LucideIcon; onClick?: () => void }> = ({ label, value, hint, tone = 'text-stone-900', icon: Icon, onClick }) => {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick} className={`text-left bg-white border border-stone-200 border-t-4 border-t-ink p-4 sm:p-5 ${onClick ? 'hover:border-t-sun hover:shadow-[0_18px_36px_-18px_rgba(0,0,0,0.3)] transition' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-stone-500">{label}</p>
        {Icon && <Icon className="w-4 h-4 text-stone-400" />}
      </div>
      <p className={`mt-2 font-display font-extrabold text-[26px] sm:text-[32px] leading-none tabular-nums ${tone}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </Tag>
  );
};

/** Animated circular progress. */
export const ProgressRing: React.FC<{ pct: number; size?: number; stroke?: number; label?: React.ReactNode; tone?: string }> = ({ pct, size = 64, stroke = 7, label, tone = '#3a2f8f' }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e7e5e4" strokeWidth={stroke} fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={tone} strokeWidth={stroke} fill="none" strokeLinecap="butt"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (c * Math.min(100, pct)) / 100 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-stone-900 tabular-nums">{label ?? `${pct}%`}</span>
    </div>
  );
};

export const StatusPill: React.FC<{ tone: 'green' | 'amber' | 'red' | 'stone' | 'emerald'; children: React.ReactNode }> = ({ tone, children }) => {
  const map = {
    green: 'bg-green-100 text-green-800',
    amber: 'bg-amber-100 text-amber-900',
    red: 'bg-red-100 text-red-700',
    stone: 'bg-stone-100 text-stone-700',
    emerald: 'bg-sun text-ink',
  };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${map[tone]}`}>{children}</span>;
};

/** Pill filter group. */
export function Segmented<T extends string>({ value, onChange, options, id }: { value: T; onChange: (v: T) => void; options: [T, string][]; id: string }) {
  return (
    <div role="tablist" className="inline-flex flex-wrap gap-1 p-1 bg-white border border-stone-200">
      {options.map(([v, l]) => (
        <button key={v} role="tab" aria-selected={value === v} onClick={() => onChange(v)}
          className={`relative px-3.5 py-1.5 text-sm font-semibold transition-colors ${value === v ? 'text-white' : 'text-stone-600 hover:text-ink'}`}>
          {value === v && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 bg-ink" transition={{ type: 'spring', stiffness: 450, damping: 34 }} />}
          <span className="relative">{l}</span>
        </button>
      ))}
    </div>
  );
}

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Next date/time a weekly timetable slot happens ("Monday", "08:00 - 10:00"). */
export function nextOccurrence(day: string, time: string, now = new Date()) {
  const target = DAYS.findIndex(d => d.toLowerCase() === day.toLowerCase());
  if (target < 0) return null;
  const [hh, mm] = (time.match(/(\d{1,2}):(\d{2})/)?.slice(1) ?? ['8', '00']).map(Number);
  const d = new Date(now);
  d.setHours(hh, mm, 0, 0);
  let add = (target - now.getDay() + 7) % 7;
  if (add === 0 && d.getTime() < now.getTime() - 2 * 3600000) add = 7;
  d.setDate(d.getDate() + add);
  return d;
}

export const countdown = (to: Date, now = new Date()) => {
  const ms = to.getTime() - now.getTime();
  if (ms <= 0) return 'now';
  const m = Math.round(ms / 60000);
  if (m < 60) return `in ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `in ${h} h ${m % 60} min`;
  const d = Math.round(h / 24);
  return d === 1 ? 'tomorrow' : `in ${d} days`;
};

export const fmtDate = (iso: string | Date, withTime = false) =>
  new Date(iso).toLocaleString(undefined, withTime ? { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', year: 'numeric' });
