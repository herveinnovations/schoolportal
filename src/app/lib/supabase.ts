import { createClient } from '@supabase/supabase-js';

// The publishable key is meant to be public: the database rules (RLS) decide what each person can see.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://ytltvxajoygsczmvhftk.supabase.co';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_3WakPcjOwbRXW_yvwPkywQ_6r1a0CoJ';

/** What kind of email link brought the person here (read before the client consumes the URL). */
export const initialAuthLink: 'invite' | 'recovery' | null = (() => {
  try {
    const h = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const q = new URLSearchParams(window.location.search);
    const t = h.get('type') ?? q.get('type');
    return t === 'invite' || t === 'recovery' ? t : null;
  } catch { return null; }
})();

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

/** Where email links should send people back to (this site, wherever it is hosted). */
export const siteUrl = () => `${window.location.origin}${import.meta.env.BASE_URL}`;

/* ---------- Converting between database rows (snake_case) and app objects (camelCase) ---------- */

const toSnake = (k: string) => k.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);
const toCamel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

/** App object → row. Undefined values are left out; nested objects are stored as JSON. */
export function toRow<T extends object>(obj: T, omit: string[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || omit.includes(k)) continue;
    out[toSnake(k)] = v;
  }
  return out;
}

/** Row → app object. Database nulls become undefined, which is what the screens expect. */
export function fromRow<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null) continue;
    out[toCamel(k)] = typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v) && /(amount|price|score|grade|marks|total)/i.test(k) ? Number(v) : v;
  }
  return out as T;
}

export const newId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16); });

/** Turns Supabase error text into something a student or lecturer can act on. */
export function friendlyError(message?: string) {
  if (!message) return 'Something went wrong. Please try again.';
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'That email and password don’t match an account.';
  if (m.includes('email not confirmed')) return 'Please confirm your email first. Check your inbox for the link we sent.';
  if (m.includes('user already registered')) return 'An account with this email already exists. Sign in instead.';
  if (m.includes('row-level security') || m.includes('permission denied')) return 'You don’t have permission to do that.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'No connection. Check your internet and try again.';
  if (m.includes('rate limit')) return 'Too many attempts. Please wait a few minutes and try again.';
  if (m.includes('password should be')) return 'Use a stronger password (at least 6 characters).';
  return message;
}
