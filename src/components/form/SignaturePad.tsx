'use client';

import { useEffect, useRef, useState } from 'react';
import type { Attachment } from '@/db/schema';
import type { Lang } from '@/lib/checklist/types';
import { t } from '@/lib/i18n';

interface Props {
  token: string;
  fieldId: string;
  lang: Lang;
  existing?: Attachment;
  disabled?: boolean;
  onSaved: () => void;
}

export function SignaturePad({
  token,
  fieldId,
  lang,
  existing,
  disabled,
  onSaved,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  const [busy, setBusy] = useState(false);
  const [redraw, setRedraw] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
  }, [redraw]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawing.current = true;
    dirty.current = true;
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    dirty.current = false;
  }

  async function save() {
    const canvas = canvasRef.current;
    if (!canvas || !dirty.current) return;
    setBusy(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (!blob) return;
      const body = new FormData();
      body.append('file', blob, 'signature.png');
      body.append('fieldId', fieldId);
      body.append('kind', 'signature');
      const res = await fetch(`/api/f/${token}/attachments`, { method: 'POST', body });
      if (res.ok) {
        dirty.current = false;
        onSaved();
      }
    } finally {
      setBusy(false);
    }
  }

  if (existing && disabled) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/files/${existing.id}?token=${token}`}
        alt={t(lang, 'form.signature')}
        className="h-28 rounded-lg border border-slate-200 bg-white"
      />
    );
  }

  return (
    <div>
      {existing && (
        <div className="mb-2 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/files/${existing.id}?token=${token}`}
            alt={t(lang, 'form.signature')}
            className="h-16 rounded border border-slate-200 bg-white"
          />
          <span className="text-xs text-emerald-700">{t(lang, 'form.signatureSaved')}</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="signature-canvas h-36 w-full rounded-lg border-2 border-dashed border-slate-300 bg-white"
      />
      <p className="help-text">{t(lang, 'form.signatureHint')}</p>
      <div className="mt-2 flex gap-2">
        <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={clear}>
          {t(lang, 'form.signatureClear')}
        </button>
        <button
          type="button"
          className="btn-primary px-3 py-1.5 text-xs"
          onClick={() => void save()}
          disabled={busy}
        >
          {t(lang, 'form.signatureSave')}
        </button>
      </div>
    </div>
  );
}
