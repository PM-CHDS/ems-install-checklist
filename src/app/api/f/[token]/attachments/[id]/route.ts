import { NextResponse } from 'next/server';
import { isLocked, loadByToken, removeAttachment } from '@/lib/instances';
import { storage } from '@/lib/storage';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ token: string; id: string }> },
) {
  const { token, id } = await params;
  const loaded = await loadByToken(token);
  if (!loaded) return new NextResponse('not found', { status: 404 });
  if (isLocked(loaded.instance))
    return new NextResponse('form already submitted', { status: 409 });

  const row = await removeAttachment(loaded.instance.id, id);
  if (!row) return new NextResponse('not found', { status: 404 });
  // Best-effort: a stale blob is harmless, a broken request is not.
  await storage()
    .delete(row.storageKey)
    .catch(() => undefined);
  return NextResponse.json({ ok: true });
}
