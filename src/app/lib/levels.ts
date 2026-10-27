/** Course categories, matching the official enrolment form. */
export const LEVELS = [
  { id: 'beginner', label: 'Beginner', tone: 'bg-sun text-ink' },
  { id: 'office', label: 'Office package', tone: 'bg-royal text-white' },
  { id: 'teveta_level_3', label: 'TEVET Level III', tone: 'bg-navy text-white' },
  { id: 'short', label: 'Short course', tone: 'bg-stone-200 text-ink' },
  { id: 'advanced', label: 'Advanced', tone: 'bg-ink text-white' },
  { id: 'refresher', label: 'Refresher I.C.T', tone: 'bg-white text-ink border border-ink' },
] as const;

export type Level = typeof LEVELS[number]['id'];

export const levelLabel = (l?: string) => LEVELS.find(x => x.id === l)?.label ?? 'Beginner';
export const levelTone = (l?: string) => LEVELS.find(x => x.id === l)?.tone ?? 'bg-sun text-ink';
