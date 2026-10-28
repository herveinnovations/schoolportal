import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '@/app/context/AuthContext';
import { useSite, type DocAudience } from '@/app/context/SiteContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { UploadCloud, FileText, Trash2, Download, Plus, Search } from 'lucide-react';
import { EmptyState, StatusPill, Segmented, fmtDate } from '../shell/ui';
import { Spinner } from '../AuthShell';
import { DocumentRow, audienceLabel } from '../DocumentsList';
import { fileSize } from '@/app/lib/media';

/** Staff upload documents (prospectus, forms, timetables, handouts) and choose who can download them. */
export const Files: React.FC = () => {
  const { user, courses } = useAuth();
  const { documents, addDocument, removeDocument } = useSite();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState<{ title: string; description: string; audience: DocAudience; courseId: string }>({ title: '', description: '', audience: 'students', courseId: '' });
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [view, setView] = useState<'all' | DocAudience>('all');
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  if (!user) return null;

  const choose = (f?: File | null) => {
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) { toast.error('Files can be up to 25 MB'); return; }
    setFile(f);
    setForm(x => ({ ...x, title: x.title || f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') }));
    setOpen(true);
  };

  const upload = async () => {
    if (!file || !form.title.trim()) { toast.error('Choose a file and give it a title'); return; }
    if (form.audience === 'course' && !form.courseId) { toast.error('Choose the course'); return; }
    setBusy(true);
    const err = await addDocument(file, { title: form.title.trim(), description: form.description.trim(), audience: form.audience, courseId: form.courseId || undefined, uploadedBy: user.id, uploadedByName: user.name });
    setBusy(false);
    if (err) { toast.error(err); return; }
    toast.success('File uploaded', { description: `${audienceLabel(form.audience, courses.find(c => c.id === form.courseId)?.name)} can now download it.` });
    setOpen(false); setFile(null); setForm({ title: '', description: '', audience: 'students', courseId: '' });
  };

  const shown = documents
    .filter(d => view === 'all' || d.audience === view)
    .filter(d => !q.trim() || `${d.title} ${d.fileName} ${d.description ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <button type="button" onClick={() => input.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); choose(e.dataTransfer.files?.[0]); }}
        className={`w-full px-6 py-10 text-center transition-colors ${drag ? 'border-sun bg-sun/10' : 'bg-stone-100 hover:bg-stone-200'}`}>
        <span className="mx-auto w-14 h-14 bg-sun text-ink flex items-center justify-center"><UploadCloud className="w-7 h-7" /></span>
        <p className="mt-4 font-display font-extrabold text-[19px] text-ink">Drop a file here, or click to choose</p>
        <p className="mt-1 text-sm text-stone-500">PDF, Word, Excel, PowerPoint, pictures or zip. Up to 25 MB each.</p>
      </button>
      <input ref={input} type="file" className="sr-only" aria-label="Choose a file to upload" onChange={e => { choose(e.target.files?.[0]); e.target.value = ''; }} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented id="files-view" value={view} onChange={setView} options={[['all', `All (${documents.length})`], ['public', 'Website'], ['students', 'Students'], ['lecturers', 'Lecturers'], ['course', 'Courses']]} />
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input aria-label="Search files" className="pl-9" placeholder="Search files" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={FileText} title={documents.length ? 'No files match' : 'No files yet'} text={documents.length ? 'Try a different filter or search.' : 'Upload a prospectus, timetable, application form or handout. You choose who can download it.'}
          action={!documents.length ? <Button onClick={() => input.current?.click()}><Plus className="w-4 h-4" />Upload a file</Button> : undefined} />
      ) : (
        <ul className="bg-white border border-stone-200 divide-y divide-stone-100">
          <AnimatePresence initial={false}>
            {shown.map(d => (
              <motion.li key={d.id} layout exit={{ opacity: 0, height: 0 }}>
                <DocumentRow doc={d} courseName={courses.find(c => c.id === d.courseId)?.name}
                  extra={<>
                    <span className="hidden md:inline text-xs text-stone-400">{d.uploadedByName ?? ''} · {fmtDate(d.createdAt)}</span>
                    <Button size="icon" variant="ghost" aria-label={`Delete ${d.title}`} onClick={() => setConfirm(d.id)}><Trash2 className="w-4 h-4 text-stone-400" /></Button>
                  </>} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {/* Upload details */}
      <Dialog open={open} onOpenChange={o => { if (!busy) { setOpen(o); if (!o) setFile(null); } }}>
        <DialogContent>
          <DialogHeader className="text-left"><DialogTitle>Upload a file</DialogTitle><DialogDescription>{file ? `${file.name} · ${fileSize(file.size)}` : ''}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="doc-title">Title</Label><Input id="doc-title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. 2027 Prospectus" /></div>
            <div className="space-y-1.5"><Label htmlFor="doc-desc">Description (optional)</Label><Textarea id="doc-desc" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="doc-aud">Who can download it</Label>
              <Select value={form.audience} onValueChange={(v: DocAudience) => setForm({ ...form, audience: v })}>
                <SelectTrigger id="doc-aud"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Everyone (shown on the website)</SelectItem>
                  <SelectItem value="all">All students and lecturers</SelectItem>
                  <SelectItem value="students">All students</SelectItem>
                  <SelectItem value="lecturers">All lecturers</SelectItem>
                  <SelectItem value="course">Students and lecturer of one course</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.audience === 'course' && (
              <div className="space-y-1.5"><Label htmlFor="doc-course">Course</Label>
                <Select value={form.courseId} onValueChange={v => setForm({ ...form, courseId: v })}>
                  <SelectTrigger id="doc-course"><SelectValue placeholder="Choose a course" /></SelectTrigger>
                  <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {form.audience === 'public' && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">Anyone can download this from the website, without signing in.</p>}
            <Button className="w-full" onClick={upload} disabled={busy}>{busy ? <><Spinner />Uploading…</> : <><UploadCloud className="w-4 h-4" />Upload</>}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirm} onOpenChange={o => !o && setConfirm(null)}>
        <DialogContent>
          {(() => {
            const d = documents.find(x => x.id === confirm);
            return d ? <>
              <DialogHeader className="text-left"><DialogTitle>Delete “{d.title}”?</DialogTitle><DialogDescription>People won’t be able to download it any more. This can’t be undone.</DialogDescription></DialogHeader>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirm(null)}>Keep it</Button>
                <Button variant="destructive" onClick={async () => { const err = await removeDocument(d); setConfirm(null); err ? toast.error(err) : toast.success('File deleted'); }}>Delete</Button>
              </div>
            </> : null;
          })()}
        </DialogContent>
      </Dialog>

      <p className="text-xs text-stone-500 flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />Downloads use private links that expire after 10 minutes, so files can’t be shared outside the portal (except files marked “Everyone”). <StatusPill tone="stone">Private</StatusPill></p>
    </div>
  );
};
