import React, { useMemo } from 'react';
import { motion } from 'motion/react';

const COLORS = ['#3a2f8f', '#fec131', '#f59e0b', '#fbbf24', '#262626', '#cdc8ee'];

/** A short burst of confetti for wins like passing an exam. Skipped when reduced motion is on. */
export const Confetti: React.FC<{ show: boolean }> = ({ show }) => {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const bits = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    id: i, x: (Math.random() - 0.5) * 900, y: -(200 + Math.random() * 380), r: Math.random() * 720 - 360,
    c: COLORS[i % COLORS.length], w: 6 + Math.random() * 6, delay: Math.random() * 0.15,
  })), []);
  if (!show || reduce) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] flex items-end justify-center overflow-hidden" aria-hidden>
      {bits.map(b => (
        <motion.span key={b.id} className="absolute bottom-1/3 rounded-sm" style={{ width: b.w, height: b.w * 0.45, background: b.c }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 520], rotate: b.r, opacity: [1, 1, 0] }}
          transition={{ duration: 2.2, delay: b.delay, ease: 'easeOut', times: [0, 0.35, 1] }} />
      ))}
    </div>
  );
};
