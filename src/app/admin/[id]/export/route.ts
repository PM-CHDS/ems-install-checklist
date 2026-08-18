import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { listEvents, loadById } from '@/lib/instances';
import { summarize } from '@/lib/checklist/state';

/** Full machine-readable dump of one form: answers, attachments, audit trail. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) return new NextResponse('forbidden', { status: 403 });
  const { id } = await params;
  const loaded = await loadById(id);
  if (!loaded) return new NextResponse('not found', { status: 404 });

  const { instance, checklist, state, attachments } = loaded;
  const events = await listEvents(instance.id, 5000);

  const payload = {
    instance: {
      id: instance.id,
      label: instance.label,
      customerName: instance.customerName,
      customerEmail: instance.customerEmail,
      checklist: `${instance.checklistSlug} v${instance.checklistVersion}`,
      status: instance.status,
      lang: instance.lang,
      createdAt: instance.createdAt,
      submittedAt: instance.submittedAt,
    },
    summary: summarize(checklist, state),
    answers: checklist.sections.map((s) => ({
      section: s.id,
      fields: s.fields
        .filter((f) => f.id in state.values || state.photoCounts[f.id])
        .map((f) => ({
          id: f.id,
          labelCs: f.labelCs,
          labelEn: f.labelEn,
          type: f.type,
          value: state.values[f.id] ?? null,
          failNote: state.failNotes[f.id] ?? null,
          // Fixed-row tables are positional; ship the row labels so the export
          // stands on its own without the checklist definition beside it.
          ...(f.fixedRows ? { rowLabels: f.fixedRows } : {}),
          ...(f.columns ? { columns: f.columns.map((c) => c.id) } : {}),
        })),
    })),
    attachments: attachments.map((a) => ({
      id: a.id,
      fieldId: a.fieldId,
      kind: a.kind,
      filename: a.filename,
      mime: a.mime,
      size: a.size,
      createdAt: a.createdAt,
    })),
    events,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="${instance.checklistSlug}-${instance.id}.json"`,
    },
  });
}
