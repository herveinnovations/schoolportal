import { supabase, newId } from './supabase';

/** Shrinks a photo before upload so pages stay fast on mobile data. GIFs are left as they are. */
export async function prepareImage(file: File, maxSize = 2000, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('That file could not be read as a picture.'));
      i.src = url;
    });
    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, type, quality));
    return blob && blob.size < file.size ? blob : file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const safeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '').slice(-60) || 'file';

/** Uploads a picture to the public website store and returns its web address. */
export async function uploadSiteImage(file: File, folder: string, maxSize = 2000): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose a picture (JPG, PNG or WebP).');
  if (file.size > 25 * 1024 * 1024) throw new Error('That picture is too large. Choose one under 25 MB.');
  const blob = await prepareImage(file, maxSize);
  const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/gif' ? 'gif' : 'jpg';
  const path = `${folder}/${Date.now()}-${newId().slice(0, 8)}.${ext}`;
  const { error } = await supabase.storage.from('site-media').upload(path, blob, { contentType: blob.type || file.type, cacheControl: '31536000', upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from('site-media').getPublicUrl(path).data.publicUrl;
}

/** Uploads a document to the private store and returns where it was saved. */
export async function uploadDocumentFile(file: File): Promise<{ path: string; name: string; type: string; size: number }> {
  if (file.size > 25 * 1024 * 1024) throw new Error('Files can be up to 25 MB.');
  const path = `${new Date().getFullYear()}/${Date.now()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from('documents').upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
  if (error) throw new Error(error.message);
  return { path, name: file.name, type: file.type, size: file.size };
}

/** A short-lived download link for a document the person is allowed to see. */
export async function documentLink(path: string, fileName: string): Promise<string> {
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 60 * 10, { download: fileName });
  if (error || !data) throw new Error(error?.message ?? 'Could not open this file.');
  return data.signedUrl;
}

export const fileSize = (n?: number) =>
  !n ? '' : n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
