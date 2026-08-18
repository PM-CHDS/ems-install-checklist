import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { attachments, formInstances } from '@/db/schema';
import { isAdmin } from '@/lib/auth';
import { storage } from '@/lib/storage';

/**
 * Serves an uploaded file. Access is granted to an admin session, or to whoever
 * holds the form's link token — the same secret that lets them fill the form.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [row] = await db
    .select({
      attachment: attachments,
      token: formInstances.token,
    })
    .from(attachments)
    .innerJoin(formInstances, eq(attachments.instanceId, formInstances.id))
    .where(eq(attachments.id, id))
    .limit(1);

  if (!row) return new NextResponse('not found', { status: 404 });

  const providedToken = new URL(req.url).searchParams.get('token');
  if (providedToken !== row.token && !(await isAdmin()))
    return new NextResponse('forbidden', { status: 403 });

  try {
    const { body, mime } = await storage().get(row.attachment.storageKey);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'content-type': mime ?? row.attachment.mime,
        'content-length': String(body.byteLength),
        'cache-control': 'private, max-age=3600',
        'content-disposition': `inline; filename="${encodeURIComponent(
          row.attachment.filename ?? 'file',
        )}"`,
      },
    });
  } catch {
    return new NextResponse('file missing from storage', { status: 404 });
  }
}
