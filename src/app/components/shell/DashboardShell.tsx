import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { LogOut, MoreHorizontal, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BrandMark } from '../BrandMark';
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
  n ? <span className={`min-w-5 h-5 px-1.5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center tabular-nums ${className}`}>{n > 99 ? '99+' : n}</span> : null;

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
        <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-white border-r border-stone-200 z-40">
          <div className="h-16 px-5 flex items-center gap-2.5 border-b border-stone-100">
            <BrandMark size="sm" />
            <div className="leading-tight">
              <p className="font-bold text-stone-900">Alphatech</p>
              <p className="text-[10px] font-semibold text-stone-900 -mt-0.5">Computer Institute</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">{portal} portal</p>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label={`${portal} navigation`}>
            {Object.entries(sections).map(([section, list]) => (
              <div key={section || 'main'}>
                {section && <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">{section}</p>}
                <ul className="space-y-0.5">
                  {list.map(item => {
                    const on = item.id === active;
                    const Icon = item.icon;
                    return (
                      <li key={item.id}>
                        <button onClick={() => go(item.id)} aria-current={on ? 'page' : undefined}
                          className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${on ? 'text-emerald-900 font-semibold' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'}`}>
                          {on && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-lg bg-emerald-50 ring-1 ring-emerald-100" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                          {on && <motion.span layoutId="nav-bar" className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-emerald-600" />}
                          <Icon className={`relative w-[18px] h-[18px] shrink-0 ${on ? 'text-emerald-700' : 'text-stone-400'}`} />
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
          <div className="p-3 border-t border-stone-100">
            <div className="flex items-center gap-3 p-2 rounded-xl">
              <Avatar className="w-9 h-9">
                <AvatarImage src={user.profilePicture} />
                <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-semibold">{initials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-900 truncate">{user.name}</p>
                <p className="text-xs text-stone-500 truncate">{user.studentNumber ?? user.email}</p>
              </div>
              <button onClick={onLogout} aria-label="Log out" title="Log out" className="p-2 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
        </aside>

        <div className="lg:pl-64 flex flex-col min-h-screen">
          {/* Top bar */}
          <header className="sticky z-30 bg-white/90 backdrop-blur border-b border-stone-200" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
            <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center gap-3">
              <span className="lg:hidden"><BrandMark size="sm" /></span>
              <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  <motion.h1 key={active} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                    className="text-base sm:text-lg font-bold text-stone-900 leading-tight truncate">
                    {current?.label}
                  </motion.h1>
                </AnimatePresence>
                {subtitle && <p className="text-xs text-stone-500 truncate">{subtitle}</p>}
              </div>
              <div className="flex items-center gap-2">{actions}</div>
              <Avatar className="w-8 h-8 lg:hidden">
                <AvatarImage src={user.profilePicture} />
                <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-semibold">{initials(user.name)}</AvatarFallback>
              </Avatar>
            </div>
          </header>

          <main className="dash-main flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-12">{children}</main>
        </div>

        {/* Bottom bar (phones) */}
        <nav aria-label={`${portal} navigation`} className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-stone-200"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)' }}>
          <ul className="grid grid-cols-5">
            {bottom.map(item => {
              const on = item.id === active;
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button onClick={() => go(item.id)} aria-current={on ? 'page' : undefined} className="relative w-full h-16 flex flex-col items-center justify-center gap-1 text-[11px] font-medium">
                    {on && <motion.span layoutId="bottom-active" className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-emerald-600" />}
                    <span className="relative">
                      <Icon className={`w-5 h-5 ${on ? 'text-emerald-700' : 'text-stone-400'}`} />
                      {item.badge ? <span className="absolute -top-1.5 -right-2.5"><Badge n={item.badge} /></span> : null}
                    </span>
                    <span className={on ? 'text-emerald-800' : 'text-stone-500'}>{item.label.split(' ')[0]}</span>
                  </button>
                </li>
              );
            })}
            <li>
              <button onClick={() => setMoreOpen(true)} aria-expanded={moreOpen} className="relative w-full h-16 flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-stone-500">
                <span className="relative">
                  <MoreHorizontal className={`w-5 h-5 ${!primary.includes(active) ? 'text-emerald-700' : 'text-stone-400'}`} />
                  {moreBadge ? <span className="absolute -top-1.5 -right-2.5"><Badge n={moreBadge} /></span> : null}
                </span>
                <span className={!primary.includes(active) ? 'text-emerald-800' : ''}>More</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* "More" sheet (phones) */}
        <AnimatePresence>
          {moreOpen && (
            <>
              <motion.div className="lg:hidden fixed inset-0 z-50 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMoreOpen(false)} />
              <motion.div role="dialog" aria-label="All pages" className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
                <div className="sticky top-0 bg-white pt-3 pb-2 px-5 flex items-center justify-between">
                  <span className="absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1 rounded-full bg-stone-300" />
                  <p className="font-semibold text-stone-900 mt-2">All pages</p>
                  <button onClick={() => setMoreOpen(false)} aria-label="Close" className="mt-2 p-2 -mr-2 rounded-full hover:bg-stone-100"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2 px-4">
                  {items.map(item => {
                    const on = item.id === active;
                    const Icon = item.icon;
                    return (
                      <button key={item.id} onClick={() => go(item.id)}
                        className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border text-xs font-medium ${on ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'border-stone-200 text-stone-700'}`}>
                        <Icon className={`w-5 h-5 ${on ? 'text-emerald-700' : 'text-stone-500'}`} />
                        {item.label}
                        {item.badge ? <span className="absolute top-1.5 right-1.5"><Badge n={item.badge} /></span> : null}
                      </button>
                    );
                  })}
                </div>
                <div className="px-4 pt-4">
                  <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-200 text-red-600 text-sm font-medium"><LogOut className="w-4 h-4" />Log out</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
};
