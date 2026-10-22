import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/app/context/AuthContext';
import { useSite, type SchoolDocument, type DocAudience } from '@/app/context/SiteContext';
import { Download, FileText, FileSpreadsheet, FileImage, FileArchive, Presentation } from 'lucide-react';
import { EmptyState, StatusPill, fmtDate } from './shell/ui';
import { fileSize } from '@/app/lib/media';

export const audienceLabel = (a: DocAudience, courseName?: string) =>
  a === 'public' ? 'Everyone' : a === 'all' ? 'Students and lecturers' : a === 'students' ? 'All students' : a === 'lecturers' ? 'Lecturers' : courseName ?? 'One course';

const iconFor = (name: string, mime?: string) => {
  const n = name.toLowerCase();
  if (mime?.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/.test(n)) return FileImage;
  if (/\.(xlsx?|csv)$/.test(n)) return FileSpreadsheet;
  if (/\.(pptx?)$/.test(n)) return Presentation;
  if (/\.(zip|rar|7z)$/.test(n)) return FileArchive;
  return FileText;
};

/** One file in a list, with a download button. */
export const DocumentRow: React.FC<{ doc: SchoolDocument; courseName?: string; extra?: React.ReactNode; showAudience?: boolean }> = ({ doc, courseName, extra, showAudience = true }) => {
  const { openDocument } = useSite();
  const [busy, setBusy] = useState(false);
  const Icon = iconFor(doc.fileName, doc.mimeType);
  const open = async () => {
    setBusy(true);
    try { await openDocument(doc); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3.5">
      <span className="w-11 h-11 bg-stone-100 text-ink flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></span>
      <div className="flex-1 min-w-[180px]">
        <p className="font-semibold text-ink">{doc.title}</p>
        <p className="text-xs text-stone-500">{[doc.fileName.split('.').pop()?.toUpperCase(), fileSize(doc.sizeBytes), fmtDate(doc.createdAt)].filter(Boolean).join(' · ')}</p>
        {doc.description && <p className="text-sm text-stone-600 mt-1">{doc.description}</p>}
      </div>
      {showAudience && <StatusPill tone={doc.audience === 'public' ? 'emerald' : 'stone'}>{audienceLabel(doc.audience, courseName)}</StatusPill>}
      {extra}
      <button onClick={open} disabled={busy} className="inline-flex items-center gap-2 h-9 px-4 bg-sun hover:bg-sun-deep text-ink text-sm font-semibold disabled:opacity-60">
        <Download className="w-4 h-4" />{busy ? 'Opening…' : 'Download'}
      </button>
    </div>
  );
};

/** Documents page for students and lecturers: everything they are allowed to download. */
export const DocumentsList: React.FC = () => {
  const { courses } = useAuth();
  const { documents } = useSite();
  if (!documents.length) return <EmptyState icon={FileText} title="No documents yet" text="Forms, timetables, handouts and other files from the school will appear here." />;
  return (
    <ul className="bg-white border border-stone-200 divide-y divide-stone-100">
      {documents.map(d => <li key={d.id}><DocumentRow doc={d} courseName={courses.find(c => c.id === d.courseId)?.name} /></li>)}
    </ul>
  );
};
