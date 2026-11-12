import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { listEvents, loadById } from '@/lib/instances';
import { viewAnswers, type Entry } from '@/lib/checklist/answer-view';

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
  // In the form's own language; hidden answers stay in the dump, flagged.
  const view = viewAnswers(checklist, state, instance.lang, { includeHidden: true });

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
    summary: view.summary,
    answers: view.sections.map(({ section, entries }) => ({
      section: section.id,
      fields: entries
        .filter((e) => e.field.id in state.values || state.photoCounts[e.field.id])
        .map((e) => ({
          id: e.field.id,
          labelCs: e.field.labelCs,
          labelEn: e.field.labelEn,
          type: e.field.type,
          value: state.values[e.field.id] ?? null,
          display: display(e),
          // A hidden answer was stored under a gate that has since closed: it doesn't apply.
          hidden: e.hidden,
          failed: e.kind === 'answer' && e.failed,
          failNote: state.failNotes[e.field.id] ?? null,
          // Fixed-row tables are positional; ship the row labels so the export
          // stands on its own without the checklist definition beside it.
          ...(e.field.fixedRows ? { rowLabels: e.field.fixedRows } : {}),
          ...(e.field.columns ? { columns: e.field.columns.map((c) => c.id) } : {}),
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

/** The value as the admin view and the PDF print it. */
function display(e: Entry): string | string[][] | null {
  if (e.kind === 'answer') return e.empty ? null : e.text;
  if (e.kind === 'table') return e.table.rows.map((r) => (e.table.rowHeads ? [r.head, ...r.cells] : r.cells));
  return null;
}
