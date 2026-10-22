import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, fromRow, toRow, newId, friendlyError } from '@/app/lib/supabase';
import { uploadDocumentFile, documentLink } from '@/app/lib/media';
import { PHOTOS, SCHOOL } from '@/app/config/school';

/* ---------- What staff can edit on the website ---------- */

export interface SiteImages { hero: string; tile: string; band: string; signIn: string }
export interface SiteText {
  heroTitle: string;
  heroSubtitle: string;
  aboutLead: string;
  aboutBody1: string;
  aboutBody2: string;
}
export interface SiteContact { phone: string; email: string }

export const DEFAULT_TEXT: SiteText = {
  heroTitle: 'Alphatech – Computer Skills That Open Doors!',
  heroSubtitle: `Live classes, recorded lessons and certificates, full-time or part-time, from anywhere in Zambia. ${SCHOOL.motto}.`,
  aboutLead: 'Alphatech Computer Institute was created to help Zambians build real computer skills for work, business and further study.',
  aboutBody1: 'Whether you are using a computer for the first time or preparing for a TEVETA qualification, our lecturers teach live, record every class and mark your work online, so you always know where you stand.',
  aboutBody2: 'Everything happens in one portal: your timetable, live classes, recordings, assignments, exams, results, payments and certificates. Sign in from a phone or a computer, wherever you are.',
};
export const DEFAULT_IMAGES: SiteImages = { ...PHOTOS };
export const DEFAULT_CONTACT: SiteContact = { phone: SCHOOL.phone, email: SCHOOL.email };

export type DocAudience = 'public' | 'all' | 'students' | 'lecturers' | 'course';

export interface SchoolDocument {
  id: string;
  title: string;
  description?: string;
  filePath: string;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  audience: DocAudience;
  courseId?: string;
  uploadedBy?: string;
  uploadedByName?: string;
  createdAt: string;
}

interface SiteContextType {
  images: SiteImages;
  text: SiteText;
  contact: SiteContact;
  ready: boolean;
  saveSection: (key: 'images' | 'text' | 'contact', value: Partial<SiteImages> | Partial<SiteText> | Partial<SiteContact>) => Promise<string | null>;
  documents: SchoolDocument[];
  addDocument: (file: File, info: { title: string; description?: string; audience: DocAudience; courseId?: string; uploadedBy?: string; uploadedByName?: string }) => Promise<string | null>;
  removeDocument: (doc: SchoolDocument) => Promise<string | null>;
  openDocument: (doc: SchoolDocument) => Promise<void>;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [raw, setRaw] = useState<Record<string, Record<string, string>>>({});
  const [documents, setDocuments] = useState<SchoolDocument[]>([]);
  const [ready, setReady] = useState(false);

  const loadContent = useCallback(async () => {
    const { data } = await supabase.from('site_content').select('key, value');
    const next: Record<string, Record<string, string>> = {};
    (data ?? []).forEach(r => { next[r.key as string] = (r.value ?? {}) as Record<string, string>; });
    setRaw(next);
    setReady(true);
  }, []);

  const loadDocuments = useCallback(async () => {
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    setDocuments((data ?? []).map(r => fromRow<SchoolDocument>(r)));
  }, []);

  useEffect(() => {
    loadContent();
    loadDocuments();
    // Signing in or out changes which documents someone may see
    const { data: sub } = supabase.auth.onAuthStateChange(() => { loadDocuments(); });
    const channel = supabase.channel('site-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_content' }, () => loadContent())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => loadDocuments())
      .subscribe();
    return () => { sub.subscription.unsubscribe(); supabase.removeChannel(channel); };
  }, [loadContent, loadDocuments]);

  // Saved values override the defaults; empty values fall back to them
  const pick = <T extends object>(defaults: T, saved?: Record<string, string>): T => {
    const out = { ...defaults } as Record<string, string>;
    Object.entries(saved ?? {}).forEach(([k, v]) => { if (k in out && typeof v === 'string' && v.trim()) out[k] = v; });
    if (saved && 'phone' in saved && saved.phone === '') out.phone = '';
    if (saved && 'email' in saved && saved.email === '') out.email = '';
    return out as T;
  };
  const images = useMemo(() => pick(DEFAULT_IMAGES, raw.images), [raw.images]);
  const text = useMemo(() => pick(DEFAULT_TEXT, raw.text), [raw.text]);
  const contact = useMemo(() => pick(DEFAULT_CONTACT, raw.contact), [raw.contact]);

  const saveSection: SiteContextType['saveSection'] = async (key, value) => {
    const merged = { ...(raw[key] ?? {}), ...value } as Record<string, string>;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('site_content').upsert({ key, value: merged, updated_at: new Date().toISOString(), updated_by: user?.email ?? null });
    if (error) return friendlyError(error.message);
    setRaw(r => ({ ...r, [key]: merged }));
    return null;
  };

  const addDocument: SiteContextType['addDocument'] = async (file, info) => {
    try {
      const saved = await uploadDocumentFile(file);
      const doc: SchoolDocument = {
        id: newId(), title: info.title, description: info.description || undefined, filePath: saved.path, fileName: saved.name,
        mimeType: saved.type || undefined, sizeBytes: saved.size, audience: info.audience,
        courseId: info.audience === 'course' ? info.courseId : undefined,
        uploadedBy: info.uploadedBy, uploadedByName: info.uploadedByName, createdAt: new Date().toISOString(),
      };
      const { error } = await supabase.from('documents').insert(toRow(doc));
      if (error) {
        await supabase.storage.from('documents').remove([saved.path]);
        return friendlyError(error.message);
      }
      setDocuments(d => [doc, ...d]);
      return null;
    } catch (e) {
      return friendlyError((e as Error).message);
    }
  };

  const removeDocument: SiteContextType['removeDocument'] = async (doc) => {
    const { error } = await supabase.from('documents').delete().eq('id', doc.id);
    if (error) return friendlyError(error.message);
    await supabase.storage.from('documents').remove([doc.filePath]);
    setDocuments(d => d.filter(x => x.id !== doc.id));
    return null;
  };

  const openDocument = async (doc: SchoolDocument) => {
    const url = await documentLink(doc.filePath, doc.fileName);
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noreferrer';
    a.click();
  };

  return (
    <SiteContext.Provider value={{ images, text, contact, ready, saveSection, documents, addDocument, removeDocument, openDocument }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSite = () => {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
};
