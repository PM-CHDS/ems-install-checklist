import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { loadById } from '@/lib/instances';
import { renderFormPdf } from '@/lib/pdf/form-pdf';
import type { Lang } from '@/lib/checklist/types';

/**
 * The whole filled-in form as a PDF. Written in the form's own language (what the
 * installer saw and typed in), unless `?lang=cs|en` asks for the other one.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) return new NextResponse('forbidden', { status: 403 });
  const { id } = await params;
  const loaded = await loadById(id);
  if (!loaded) return new NextResponse('not found', { status: 404 });

  const asked = new URL(req.url).searchParams.get('lang');
  const lang: Lang = asked === 'cs' || asked === 'en' ? asked : loaded.instance.lang;
  const pdf = await renderFormPdf(loaded, lang);

  const name = `${loaded.instance.checklistSlug}-${loaded.instance.label}`;
  const ascii = name.normalize('NFKD').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${ascii || loaded.instance.id}.pdf"; filename*=UTF-8''${encodeURIComponent(name)}.pdf`,
      'cache-control': 'no-store',
    },
  });
}
