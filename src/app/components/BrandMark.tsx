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
