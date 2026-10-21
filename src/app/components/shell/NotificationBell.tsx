import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, Video, FileText, CheckCircle2, AlertCircle, Megaphone, ClipboardCheck, BookOpen } from 'lucide-react';
import { useAuth, notificationsFor, type Notification } from '@/app/context/AuthContext';

const iconFor = (t: Notification['type']) => {
  if (t.startsWith('live_class')) return <Video className="w-4 h-4 text-red-600" />;
  if (t === 'payment_confirmed') return <CheckCircle2 className="w-4 h-4 text-green-600" />;
  if (t === 'payment_rejected') return <AlertCircle className="w-4 h-4 text-red-600" />;
  if (t === 'announcement') return <Megaphone className="w-4 h-4 text-amber-700" />;
  if (t.startsWith('exam')) return <ClipboardCheck className="w-4 h-4 text-emerald-700" />;
  if (t.startsWith('assignment')) return <FileText className="w-4 h-4 text-emerald-700" />;
  return <BookOpen className="w-4 h-4 text-stone-600" />;
};

export const timeAgo = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString();
};

/** Bell with an unread count and a dropdown list. `onOpen` lets the page jump to the right section. */
export const NotificationBell: React.FC<{ onOpen?: (n: Notification) => void }> = ({ onOpen }) => {
  const { user, notifications, markNotificationAsRead, markAllNotificationsRead } = useAuth();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    window.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', close); window.removeEventListener('keydown', key); };
  }, [open]);

  if (!user) return null;
  const mine = notificationsFor(notifications, user);
  const unread = mine.filter(n => !n.isRead);
  const list = (filter === 'unread' ? unread : mine).slice(0, 30);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ''}`} aria-expanded={open}
        className="relative w-10 h-10 rounded-full flex items-center justify-center text-stone-600 hover:bg-stone-100 hover:text-stone-900">
        <motion.span key={unread.length} animate={unread.length ? { rotate: [0, -14, 12, -8, 0] } : {}} transition={{ duration: 0.6 }}><Bell className="w-5 h-5" /></motion.span>
        {unread.length > 0 && <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">{unread.length}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.15 }}
            className="fixed sm:absolute inset-x-3 sm:inset-x-auto top-16 sm:top-12 sm:right-0 sm:w-96 bg-white rounded-2xl border border-stone-200 shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
              <p className="font-semibold text-stone-900">Notifications</p>
              {unread.length > 0 && <button onClick={() => markAllNotificationsRead(unread.map(n => n.id))} className="text-xs font-medium text-emerald-700 hover:underline">Mark all as read</button>}
            </div>
            <div className="flex gap-1 px-3 pt-2">
              {(['all', 'unread'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-medium ${filter === f ? 'bg-emerald-700 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>
                  {f === 'all' ? 'All' : `Unread (${unread.length})`}
                </button>
              ))}
            </div>
            <ul className="max-h-[60vh] overflow-y-auto py-2">
              {list.length === 0 && <li className="px-4 py-10 text-center text-sm text-stone-500"><Bell className="w-8 h-8 mx-auto mb-2 text-stone-300" />{filter === 'unread' ? "You're all caught up." : 'No notifications yet.'}</li>}
              {list.map(n => (
                <li key={n.id}>
                  <button onClick={() => { markNotificationAsRead(n.id); onOpen?.(n); setOpen(false); }}
                    className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-stone-50 ${!n.isRead ? 'bg-emerald-50/40' : ''}`}>
                    <span className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0">{iconFor(n.type)}</span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-stone-900 truncate">{n.title}</span>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />}
                      </span>
                      <span className="block text-sm text-stone-600 line-clamp-2">{n.message}</span>
                      <span className="block text-xs text-stone-400 mt-0.5">{timeAgo(n.timestamp)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
