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

/**
 * The full Alphatech logo: crest, then ALPHATECH over COMPUTER INSTITUTE in navy, both lines the same width.
 * Drawn as SVG text so it stays sharp at any size. Use `plate` on dark backgrounds.
 */
export const Logo: React.FC<{ height?: number; plate?: boolean; className?: string }> = ({ height = 48, plate = false, className = '' }) => (
  <span className={`inline-flex items-center shrink-0 ${plate ? 'bg-white px-3 py-2' : ''} ${className}`} style={{ gap: Math.round(height * 0.14) }}>
    <img src={logo} alt="" style={{ height }} className="w-auto" />
    <svg viewBox="0 0 212 54" style={{ height: Math.round(height * 0.68) }} className="w-auto overflow-visible" role="img" aria-label={SCHOOL.name}>
      <text x="0" y="33" textLength="212" lengthAdjust="spacingAndGlyphs" fill="#0c2f88"
        fontFamily="'Work Sans Variable', 'Arial Black', Arial, sans-serif" fontWeight="900" fontSize="40">ALPHATECH</text>
      <text x="1" y="53" textLength="210" lengthAdjust="spacingAndGlyphs" fill="#0c2f88"
        fontFamily="'Work Sans Variable', 'Arial Black', Arial, sans-serif" fontWeight="800" fontSize="18.5">COMPUTER INSTITUTE</text>
    </svg>
  </span>
);

/** Kept for older screens: the logo on a white plate. */
export const Wordmark: React.FC<{ className?: string }> = ({ className = '' }) => <Logo height={40} plate className={className} />;
