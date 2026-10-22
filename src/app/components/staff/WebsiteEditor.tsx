import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useSite, DEFAULT_IMAGES, DEFAULT_TEXT, type SiteImages, type SiteText } from '@/app/context/SiteContext';
import { uploadSiteImage } from '@/app/lib/media';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Upload, RotateCcw, ExternalLink, ImageIcon } from 'lucide-react';
import { Spinner } from '../AuthShell';

const SLOTS: { key: keyof SiteImages; title: string; where: string; ratio: string }[] = [
  { key: 'hero', title: 'Main photo', where: 'Top of the home page, behind the headline. Also used on the portal home banners.', ratio: 'aspect-[16/9]' },
  { key: 'tile', title: 'Tile photo', where: 'Next to the indigo and yellow boxes on the home page.', ratio: 'aspect-square' },
  { key: 'band', title: 'Wide photo', where: 'The wide photo in the About section, under the motto.', ratio: 'aspect-[21/9]' },
  { key: 'signIn', title: 'Sign-in photo', where: 'Left side of the sign-in and sign-up pages.', ratio: 'aspect-[4/5]' },
];

const ImageSlot: React.FC<{ slot: typeof SLOTS[number]; url: string; isDefault: boolean; onChange: (url: string) => Promise<void> }> = ({ slot, url, isDefault, onChange }) => {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [url]);

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const uploaded = await uploadSiteImage(file, 'website', slot.key === 'tile' ? 1200 : 2200);
      await onChange(uploaded);
      toast.success(`${slot.title} updated`, { description: 'It’s live on the website now.' });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="bg-white border border-stone-200 flex flex-col">
      <div className={`relative ${slot.ratio} max-h-64 w-full bg-stone-100 overflow-hidden`}>
        {!broken ? <img src={url} alt="" onError={() => setBroken(true)} className="absolute inset-0 w-full h-full object-cover" /> : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 text-sm"><ImageIcon className="w-8 h-8 mb-1" />Preview not available</div>
        )}
        {busy && <div className="absolute inset-0 bg-ink/60 flex items-center justify-center text-white text-sm gap-2"><Spinner />Uploading…</div>}
        <span className={`absolute left-0 top-0 px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${isDefault ? 'bg-white/90 text-ink' : 'bg-sun text-ink'}`}>{isDefault ? 'Stock photo' : 'Your photo'}</span>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="font-display font-bold text-[17px] text-ink">{slot.title}</p>
        <p className="text-sm text-stone-500 mt-0.5 flex-1">{slot.where}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => input.current?.click()} disabled={busy}><Upload className="w-4 h-4" />{isDefault ? 'Upload photo' : 'Replace'}</Button>
          {!isDefault && <Button size="sm" variant="outline" disabled={busy} onClick={async () => { setBusy(true); await onChange(''); setBusy(false); toast.success('Back to the stock photo'); }}><RotateCcw className="w-4 h-4" />Use stock photo</Button>}
        </div>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={`Upload ${slot.title}`} onChange={e => pick(e.target.files?.[0])} />
      </div>
    </div>
  );
};

/** Staff edit the website's photos, main text and contact details. Changes go live straight away. */
export const WebsiteEditor: React.FC = () => {
  const { images, text, contact, saveSection } = useSite();
  const [t, setT] = useState<SiteText>(text);
  const [c, setC] = useState(contact);
  const [saving, setSaving] = useState<'' | 'text' | 'contact'>('');
  useEffect(() => setT(text), [text]);
  useEffect(() => setC(contact), [contact]);

  const setImage = async (key: keyof SiteImages, url: string) => {
    const err = await saveSection('images', { [key]: url });
    if (err) toast.error(err);
  };

  const saveText = async () => {
    if (!t.heroTitle.trim()) { toast.error('The headline can’t be empty'); return; }
    setSaving('text');
    const err = await saveSection('text', t);
    setSaving('');
    err ? toast.error(err) : toast.success('Website text saved', { description: 'It’s live on the website now.' });
  };

  const saveContact = async () => {
    setSaving('contact');
    const err = await saveSection('contact', { phone: c.phone.trim(), email: c.email.trim() });
    setSaving('');
    err ? toast.error(err) : toast.success('Contact details saved');
  };

  const field = (k: keyof SiteText, label: string, rows = 0, hint?: string) => (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={`wt-${k}`}>{label}</Label>
        {t[k] !== DEFAULT_TEXT[k] && <button type="button" className="text-xs text-royal hover:underline" onClick={() => setT({ ...t, [k]: DEFAULT_TEXT[k] })}>Reset</button>}
      </div>
      {rows ? <Textarea id={`wt-${k}`} rows={rows} value={t[k]} onChange={e => setT({ ...t, [k]: e.target.value })} />
        : <Input id={`wt-${k}`} value={t[k]} onChange={e => setT({ ...t, [k]: e.target.value })} />}
      {hint && <p className="text-xs text-stone-500">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-stone-200 border-l-4 border-l-sun px-5 py-4">
        <p className="text-sm text-stone-600">Changes here go live on the website as soon as you save. Photos are resized automatically so the site stays fast on mobile data.</p>
        <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-royal hover:underline">View website <ExternalLink className="w-4 h-4" /></a>
      </div>

      <section>
        <h3 className="font-display font-extrabold text-[20px] text-ink mb-1">Photos</h3>
        <p className="text-sm text-stone-500 mb-4">Use bright, sharp photos of your own students, classrooms and computer lab. Wide (landscape) photos work best.</p>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {SLOTS.map(s => <ImageSlot key={s.key} slot={s} url={images[s.key]} isDefault={images[s.key] === DEFAULT_IMAGES[s.key]} onChange={url => setImage(s.key, url)} />)}
        </div>
      </section>

      <section className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="bg-white border border-stone-200 p-5 sm:p-6 space-y-5">
          <h3 className="font-display font-extrabold text-[20px] text-ink">Home page text</h3>
          {field('heroTitle', 'Headline', 0, 'The big text at the top of the home page. Keep it short: about 6–8 words.')}
          {field('heroSubtitle', 'Line under the headline', 2)}
          {field('aboutLead', 'About section: opening sentence', 2)}
          {field('aboutBody1', 'About section: first paragraph', 3)}
          {field('aboutBody2', 'About section: second paragraph', 3)}
          <Button onClick={saveText} disabled={saving === 'text'}>{saving === 'text' ? <><Spinner />Saving…</> : 'Save text'}</Button>
        </div>
        <div className="bg-white border border-stone-200 p-5 sm:p-6 space-y-5">
          <h3 className="font-display font-extrabold text-[20px] text-ink">Contact details</h3>
          <div className="space-y-1.5">
            <Label htmlFor="wc-phone">Phone number</Label>
            <Input id="wc-phone" value={c.phone} onChange={e => setC({ ...c, phone: e.target.value })} placeholder="+260 9xx xxx xxx" />
            <p className="text-xs text-stone-500">Shown in the home page header, FAQ and footer. Leave empty to hide it.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wc-email">Email</Label>
            <Input id="wc-email" type="email" value={c.email} onChange={e => setC({ ...c, email: e.target.value })} placeholder="info@yourschool.com" />
          </div>
          {(c.phone !== contact.phone || c.email !== contact.email) && <p className="text-xs text-amber-700">Not saved yet.</p>}
          <Button onClick={saveContact} disabled={saving === 'contact'}>{saving === 'contact' ? <><Spinner />Saving…</> : 'Save contact details'}</Button>
        </div>
      </section>
    </div>
  );
};
