'use client';

import { useRef, useState } from 'react';
import type { Attachment } from '@/db/schema';
import type { Lang } from '@/lib/checklist/types';
import { t } from '@/lib/i18n';

/** Downscale in the browser so a 12 MP phone photo doesn't become a 6 MB upload. */
async function compress(file: File, maxEdge = 2000, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/heic') return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1_500_000) return file;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  );
  return blob && blob.size < file.size ? blob : file;
}

interface Props {
  token: string;
  fieldId: string;
  lang: Lang;
  photos: Attachment[];
  disabled?: boolean;
  required?: boolean;
  onChanged: () => void;
}

export function PhotoUploader({
  token,
  fieldId,
  lang,
  photos,
  disabled,
  required,
  onChanged,
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList) {
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        const blob = await compress(file);
        body.append('file', blob, file.name);
        body.append('fieldId', fieldId);
        body.append('kind', 'photo');
        const res = await fetch(`/api/f/${token}/attachments`, {
          method: 'POST',
          body,
        });
        if (!res.ok) throw new Error(await res.text());
      }
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/f/${token}/attachments/${id}`, { method: 'DELETE' });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
          {t(lang, 'form.photos')}
          {required && <span className="ml-1 text-rose-600">*</span>}
        </span>
        {!disabled && (
          <button
            type="button"
            className="btn-secondary px-3 py-1.5 text-xs"
            onClick={() => input.current?.click()}
            disabled={busy}
          >
            {busy ? t(lang, 'form.uploading') : `+ ${t(lang, 'form.addPhoto')}`}
          </button>
        )}
        <input
          ref={input}
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && void upload(e.target.files)}
        />
      </div>

      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}

      {photos.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {photos.map((p) => (
            <li key={p.id} className="group relative">
              <a
                href={`/api/files/${p.id}?token=${token}`}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                {p.mime.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/files/${p.id}?token=${token}`}
                    alt={p.filename ?? ''}
                    className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                  />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-500">
                    PDF
                  </span>
                )}
              </a>
              {!disabled && (
                <button
                  type="button"
                  aria-label={t(lang, 'form.deletePhoto')}
                  onClick={() => void remove(p.id)}
                  className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full border border-slate-300 bg-white text-xs leading-none text-slate-600 shadow hover:bg-rose-50 hover:text-rose-600"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
