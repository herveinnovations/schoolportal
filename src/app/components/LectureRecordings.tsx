import React, { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Input } from '@/app/components/ui/input';
import { Video, Play, Calendar, Clock, Search, ExternalLink } from 'lucide-react';
import { EmptyState, fmtDate } from './shell/ui';

/** Lecture recordings for the student's courses (or one course). Each opens the lecturer's link in a new tab. */
export const LectureRecordings: React.FC<{ courseId?: string }> = ({ courseId }) => {
  const { user, recordings } = useAuth();
  const [q, setQ] = useState('');
  if (!user) return null;

  const list = recordings
    .filter(r => (courseId ? r.courseId === courseId : user.courses.includes(r.courseId)))
    .filter(r => [r.title, r.courseName, r.description ?? ''].some(t => t.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => b.recordingDate.localeCompare(a.recordingDate));

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
        <Input id="rec-search" placeholder="Search recordings" value={q} onChange={e => setQ(e.target.value)} className="pl-9 bg-white" />
      </div>
      {list.length === 0 ? (
        <EmptyState icon={Video} title={q ? 'No recordings match your search' : 'No recordings yet'} text={q ? 'Try a different word.' : 'Your lecturers add recordings after each live class.'} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {list.map(r => {
            const hasLink = /^https?:\/\//.test(r.recordingUrl);
            return (
              <article key={r.id} className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-300 transition">
                <div className="relative aspect-video bg-gradient-to-br from-emerald-800 to-stone-900 flex items-center justify-center">
                  <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                  <span className="relative w-14 h-14 rounded-full bg-white/90 text-emerald-800 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"><Play className="w-6 h-6 ml-0.5" /></span>
                  <span className="absolute bottom-2 right-2 text-[11px] font-medium bg-black/60 text-white px-2 py-0.5 rounded">{r.duration}</span>
                </div>
                <div className="p-4">
                  <p className="text-xs font-medium text-emerald-700">{r.courseName}</p>
                  <h3 className="font-bold text-stone-900 leading-snug mt-0.5">{r.title}</h3>
                  {r.description && <p className="text-sm text-stone-600 mt-1 line-clamp-2">{r.description}</p>}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{fmtDate(r.recordingDate)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{r.lecturerName}</span>
                    </span>
                    {hasLink ? (
                      <a href={r.recordingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                        Watch <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : <span className="text-stone-400">Link coming soon</span>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
