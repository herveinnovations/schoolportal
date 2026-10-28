import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { LogOut, MoreHorizontal, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BrandMark, Logo } from '../BrandMark';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import type { User } from '@/app/context/AuthContext';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  section?: string;
}

interface Props {
  portal: string;
  user: User;
  items: NavItem[];
  active: string;
  onNavigate: (id: string) => void;
  primary: string[]; // up to 4 ids shown in the phone bottom bar
  onLogout: () => void;
  actions?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
}

const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();

const Badge: React.FC<{ n?: number; className?: string }> = ({ n, className = '' }) =>
  n ? <span className={`min-w-5 h-5 px-1.5 bg-sun text-ink text-[11px] font-bold flex items-center justify-center tabular-nums ${className}`}>{n > 99 ? '99+' : n}</span> : null;

export const DashboardShell: React.FC<Props> = ({ portal, user, items, active, onNavigate, primary, onLogout, actions, subtitle, children }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const current = items.find(i => i.id === active);
  const sections = items.reduce<Record<string, NavItem[]>>((acc, i) => {
    const s = i.section ?? '';
    (acc[s] ||= []).push(i);
    return acc;
  }, {});
  const bottom = primary.map(id => items.find(i => i.id === id)).filter(Boolean) as NavItem[];
  const moreBadge = items.filter(i => !primary.includes(i.id)).reduce((s, i) => s + (i.badge ?? 0), 0);

  const go = (id: string) => { onNavigate(id); setMoreOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMoreOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-stone-50">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-ink z-40">
          <div className="bg-white px-4 py-4 flex justify-center">
            <Logo height={46} />
          </div>
          <p className="bg-sun text-ink px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em]">{portal} portal</p>
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label={`${portal} navigation`}>
            {Object.entries(sections).map(([section, list]) => (
              <div key={section || 'main'}>
                {section && <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">{section}</p>}
                <ul className="space-y-0.5">
                  {list.map(item => {
                    const on = item.id === active;
                    const Icon = item.icon;
                    return (
                      <li key={item.id}>
                        <button onClick={() => go(item.id)} aria-current={on ? 'page' : undefined}
                          className={`relative w-full flex items-center gap-3 px-3 py-2.5 text-[14px] transition-colors ${on ? 'text-white font-semibold' : 'text-white/65 hover:text-white hover:bg-white/5'}`}>
                          {on && <motion.span layoutId="nav-active" className="absolute inset-0 bg-white/10" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                          
                          <Icon className={`relative w-[18px] h-[18px] shrink-0 ${on ? 'text-sun' : 'text-white/45'}`} />
                          <span className="relative flex-1 text-left">{item.label}</span>
                          <Badge n={item.badge} className="relative" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="p-3 border-t border-white/10">
            <div className="flex items-center gap-3 p-2">
              <Avatar className="w-9 h-9">
                <AvatarImage src={user.profilePicture} />
                <AvatarFallback className="bg-sun text-ink text-xs font-bold">{initials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-white/50 truncate">{user.studentNumber ?? user.email}</p>
              </div>
              <button onClick={onLogout} aria-label="Log out" title="Log out" className="p-2 text-white/60 hover:text-sun hover:bg-white/5"><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
        </aside>

        <div className="lg:pl-64 flex flex-col min-h-screen">
          {/* Top bar */}
          <header className="sticky z-30 bg-ink lg:bg-white/95 lg:backdrop-blur lg:shadow-[0_8px_24px_-20px_rgba(0,0,0,0.35)]" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
            <div className="h-16 lg:h-[76px] px-4 sm:px-6 lg:px-8 flex items-center gap-3">
              <span className="lg:hidden bg-white p-0.5"><BrandMark size="sm" /></span>
              <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  <motion.h1 key={active} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                    className="font-display font-extrabold text-[18px] lg:text-[24px] tracking-[-0.01em] text-white lg:text-ink leading-tight truncate">
                    {current?.label}
                  </motion.h1>
                </AnimatePresence>
                {subtitle && <p className="text-xs text-white/60 lg:text-stone-500 truncate">{subtitle}</p>}
              </div>
              <div className="flex items-center gap-2">{actions}</div>
              <Avatar className="w-8 h-8 lg:hidden">
                <AvatarImage src={user.profilePicture} />
                <AvatarFallback className="bg-sun text-ink text-xs font-bold">{initials(user.name)}</AvatarFallback>
              </Avatar>
            </div>
          </header>

          <main className="dash-main flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-12">{children}</main>
        </div>

        {/* Bottom bar (phones) */}
        <nav aria-label={`${portal} navigation`} className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-ink border-t border-white/10"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)' }}>
          <ul className="grid grid-cols-5">
            {bottom.map(item => {
              const on = item.id === active;
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button onClick={() => go(item.id)} aria-current={on ? 'page' : undefined} className="relative w-full h-16 flex flex-col items-center justify-center gap-1 text-[11px] font-medium">
                    {on && <motion.span layoutId="bottom-active" className="absolute top-0 inset-x-3 h-[3px] bg-sun" />}
                    <span className="relative">
                      <Icon className={`w-5 h-5 ${on ? 'text-sun' : 'text-white/50'}`} />
                      {item.badge ? <span className="absolute -top-1.5 -right-2.5"><Badge n={item.badge} /></span> : null}
                    </span>
                    <span className={on ? 'text-white' : 'text-white/55'}>{item.label.split(' ')[0]}</span>
                  </button>
                </li>
              );
            })}
            <li>
              <button onClick={() => setMoreOpen(true)} aria-expanded={moreOpen} className="relative w-full h-16 flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-white/55">
                <span className="relative">
                  <MoreHorizontal className={`w-5 h-5 ${!primary.includes(active) ? 'text-sun' : 'text-white/50'}`} />
                  {moreBadge ? <span className="absolute -top-1.5 -right-2.5"><Badge n={moreBadge} /></span> : null}
                </span>
                <span className={!primary.includes(active) ? 'text-white' : ''}>More</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* "More" sheet (phones) */}
        <AnimatePresence>
          {moreOpen && (
            <>
              <motion.div className="lg:hidden fixed inset-0 z-50 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMoreOpen(false)} />
              <motion.div role="dialog" aria-label="All pages" className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-white shadow-2xl max-h-[85vh] overflow-y-auto"
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
                <div className="sticky top-0 bg-white pt-3 pb-2 px-5 flex items-center justify-between">
                  <span className="absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1 rounded-full bg-stone-300" />
                  <p className="font-display font-extrabold text-[18px] text-ink mt-2">All pages</p>
                  <button onClick={() => setMoreOpen(false)} aria-label="Close" className="mt-2 p-2 -mr-2 rounded-full hover:bg-stone-100"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2 px-4">
                  {items.map(item => {
                    const on = item.id === active;
                    const Icon = item.icon;
                    return (
                      <button key={item.id} onClick={() => go(item.id)}
                        className={`relative flex flex-col items-center gap-2 p-3 border text-xs font-medium ${on ? 'bg-ink border-ink text-white' : 'border-transparent bg-stone-100 text-ink'}`}>
                        <Icon className={`w-5 h-5 ${on ? 'text-sun' : 'text-ink/60'}`} />
                        {item.label}
                        {item.badge ? <span className="absolute top-1.5 right-1.5"><Badge n={item.badge} /></span> : null}
                      </button>
                    );
                  })}
                </div>
                <div className="px-4 pt-4">
                  <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-3 border border-red-200 text-red-600 text-sm font-semibold"><LogOut className="w-4 h-4" />Log out</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
};
