import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { addAttachment, isLocked, loadByToken } from '@/lib/instances';
import {
  ALLOWED_UPLOAD_MIME,
  MAX_UPLOAD_BYTES,
  extensionFor,
  storage,
} from '@/lib/storage';
import { fieldById } from '@/lib/checklist/types';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const loaded = await loadByToken(token);
  if (!loaded) return new NextResponse('not found', { status: 404 });
  return NextResponse.json(loaded.attachments);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const loaded = await loadByToken(token);
  if (!loaded) return new NextResponse('not found', { status: 404 });
  if (isLocked(loaded.instance))
    return new NextResponse('form already submitted', { status: 409 });

  const form = await req.formData();
  const file = form.get('file');
  const fieldId = String(form.get('fieldId') ?? '');
  const kind = form.get('kind') === 'signature' ? 'signature' : 'photo';

  if (!(file instanceof File)) return new NextResponse('no file', { status: 400 });
  if (!fieldById(loaded.checklist, fieldId))
    return new NextResponse(`unknown field \`${fieldId}\``, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES)
    return new NextResponse(
      `file too large (max ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB)`,
      { status: 413 },
    );

  const mime = file.type || 'application/octet-stream';
  if (!ALLOWED_UPLOAD_MIME.includes(mime))
    return new NextResponse(`unsupported file type: ${mime}`, { status: 415 });

  const key = `${loaded.instance.id}/${fieldId}/${randomUUID()}.${extensionFor(mime)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await storage().put(key, buffer, mime);

  const row = await addAttachment(loaded.instance.id, {
    fieldId,
    kind,
    storageKey: key,
    filename: file.name,
    mime,
    size: buffer.byteLength,
  });

  return NextResponse.json(row, { status: 201 });
}
