import React from 'react';
import logo from '@/assets/alphatech-logo.png';
import { SCHOOL } from '@/app/config/school';

export { logo as schoolLogo };

/** The Alphatech Computer Institute crest, optionally with the name beside it. */
export const BrandMark: React.FC<{ size?: 'sm' | 'md' | 'lg'; withName?: boolean; dark?: boolean }> = ({ size = 'md', withName = false, dark = false }) => {
  const h = size === 'sm' ? 'h-9' : size === 'lg' ? 'h-16' : 'h-11';
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={`shrink-0 ${dark ? 'bg-white rounded-xl p-1 shadow-sm' : ''}`}>
        <img src={logo} alt={withName ? '' : SCHOOL.name} className={`${h} w-auto object-contain`} />
      </span>
      {withName && (
        <span className="leading-tight text-left">
          <span className={`block font-bold text-lg tracking-tight ${dark ? 'text-white' : 'text-stone-900'}`}>{SCHOOL.shortName}</span>
          <span className={`block text-[11px] font-semibold uppercase tracking-[0.14em] ${dark ? 'text-white' : 'text-stone-900'}`}>Computer Institute</span>
        </span>
      )}
    </span>
  );
};

/** Website wordmark: ALPHA in white, TECH in yellow, on dark backgrounds. */
export const Wordmark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-3 ${className}`}>
    <img src={logo} alt="" className="h-11 w-auto bg-white p-0.5" />
    <span className="leading-none text-left">
      <span className="block font-display font-extrabold text-[22px] tracking-tight text-white">ALPHA<span className="text-sun">TECH</span></span>
      <span className="block mt-1 text-[9.5px] font-semibold tracking-[0.16em] uppercase text-white/65">Computer Institute</span>
    </span>
  </span>
);
