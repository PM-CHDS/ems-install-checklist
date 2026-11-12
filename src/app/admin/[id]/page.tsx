import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { listEvents, loadById } from '@/lib/instances';
import { viewAnswers, type Entry, type TableView } from '@/lib/checklist/answer-view';
import { title, type Lang } from '@/lib/checklist/types';
import type { Attachment } from '@/db/schema';
import { t } from '@/lib/i18n';
import { adminLang, dateLocale } from '@/lib/admin-lang';
import { StatusBadge } from '../StatusBadge';
import { CopyLink } from '../CopyLink';
import { deleteInstanceAction, markReviewed, reopenForm } from '../actions';

export const dynamic = 'force-dynamic';

export default async function InstanceDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const lang = await adminLang();
  if (!(await isAdmin())) redirect('/admin');

  const { id } = await params;
  const loaded = await loadById(id);
  if (!loaded) notFound();

  const { instance, checklist, state, attachments } = loaded;
  const events = await listEvents(instance.id, 200);
  // Hidden answers stay listed (dimmed): the admin audits what was stored, not only
  // what applies. They never count as failed checks.
  const view = viewAnswers(checklist, state, lang, { includeHidden: true });
  const { summary, failedChecks } = view;
  const url = `${process.env.PUBLIC_BASE_URL ?? ''}/f/${instance.token}`;

  const filesByField = new Map<string, Attachment[]>();
  for (const a of attachments) {
    const list = filesByField.get(a.fieldId) ?? [];
    list.push(a);
    filesByField.set(a.fieldId, list);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/admin" className="text-sm text-brand-600 hover:underline">
        ← {t(lang, 'admin.instances')}
      </Link>

      <header className="card mt-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{instance.label}</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {title(checklist, lang)} ·{' '}
              {instance.checklistSlug} v{instance.checklistVersion}
              {instance.customerName ? ` · ${instance.customerName}` : ''}
              {instance.customerEmail ? ` · ${instance.customerEmail}` : ''}
            </p>
          </div>
          <StatusBadge status={instance.status} lang={lang} />
        </div>

        <div className="mt-4">
          <CopyLink url={url} lang={lang} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Stat label={t(lang, 'admin.progress')}>
            {summary.answered}/{summary.total} ({summary.percent}%)
          </Stat>
          <Stat label={t(lang, 'admin.failedChecks')}>
            <span className={failedChecks.length ? 'text-amber-700' : ''}>
              {failedChecks.length}
            </span>
          </Stat>
          <Stat label={t(lang, 'admin.attachments')}>{attachments.length}</Stat>
          <Stat label={t(lang, 'admin.created')}>{fmt(instance.createdAt, lang)}</Stat>
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`/admin/${instance.id}/export`}
            className="btn-secondary text-xs"
            download
          >
            {t(lang, 'admin.exportJson')}
          </a>
          <a href={`/admin/${instance.id}/pdf`} className="btn-secondary text-xs" download>
            {t(lang, 'admin.exportPdf')}
          </a>
          {instance.status === 'submitted' && (
            <form action={markReviewed}>
              <input type="hidden" name="id" value={instance.id} />
              <button className="btn-secondary text-xs">
                {t(lang, 'admin.markReviewed')}
              </button>
            </form>
          )}
          {(instance.status === 'submitted' || instance.status === 'reviewed') && (
            <form action={reopenForm}>
              <input type="hidden" name="id" value={instance.id} />
              <button className="btn-secondary text-xs">{t(lang, 'admin.reopen')}</button>
            </form>
          )}
          <form action={deleteInstanceAction}>
            <input type="hidden" name="id" value={instance.id} />
            <button className="btn-ghost text-xs text-rose-600 hover:bg-rose-50">
              {t(lang, 'admin.deleteInstance')}
            </button>
          </form>
        </div>
      </header>

      {failedChecks.length > 0 && (
        <section className="card mt-6 border-amber-300 p-5">
          <h2 className="text-sm font-semibold text-amber-900">
            ⚠ {t(lang, 'admin.failedChecks')} ({failedChecks.length})
          </h2>
          <ul className="mt-2 divide-y divide-amber-100">
            {failedChecks.map((f) => (
              <li key={f.field.id} className="py-2">
                <p className="text-sm font-medium text-slate-800">{f.label}</p>
                <p className="mt-0.5 text-sm text-slate-600">
                  {f.failNote || (
                    <em className="text-rose-600">{t(lang, 'admin.noExplanation')}</em>
                  )}
                </p>
                <Files files={filesByField.get(f.field.id) ?? []} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
          {t(lang, 'admin.answers')}
        </h2>
        <div className="mt-3 space-y-4">
          {view.sections.map(({ section, title: sectionTitle, entries }) => (
            <div key={section.id} className="card overflow-hidden">
              <h3 className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700">
                {sectionTitle}
              </h3>
              <dl className="divide-y divide-slate-100">
                {entries
                  .filter((e) => e.kind !== 'group' && (e.kind !== 'note' || e.field.photo))
                  .map((e) => (
                    <AnswerRow
                      key={e.field.id}
                      entry={e}
                      files={filesByField.get(e.field.id) ?? []}
                      lang={lang}
                    />
                  ))}
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
          {t(lang, 'admin.timeline')} ({events.length})
        </h2>
        <div className="card mt-3 max-h-96 overflow-y-auto">
          <ul className="divide-y divide-slate-100 text-xs">
            {events.map((e) => (
              <li key={e.id} className="flex gap-3 px-4 py-2">
                <span className="w-32 shrink-0 text-slate-400 tabular-nums">
                  {fmt(e.createdAt, lang)}
                </span>
                <span className="w-36 shrink-0 font-medium text-slate-600">{e.type}</span>
                <span className="w-48 shrink-0 truncate text-slate-500">
                  {e.fieldId ?? ''}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-slate-500">
                  {e.payload ? JSON.stringify(e.payload) : ''}
                </span>
                <span className="shrink-0 text-slate-400">{e.actor}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function AnswerRow({
  entry,
  files,
  lang,
}: {
  entry: Entry;
  files: Attachment[];
  lang: Lang;
}) {
  const failed = entry.kind === 'answer' && entry.failed;

  return (
    <div
      className={`grid gap-1 px-4 py-2.5 sm:grid-cols-[1fr_1.2fr] ${
        failed ? 'bg-amber-50/60' : ''
      } ${entry.hidden ? 'opacity-50' : ''}`}
    >
      <dt className="text-sm text-slate-600">
        {entry.label}
        {entry.hidden && (
          <span className="ml-1 text-xs text-slate-400">({t(lang, 'admin.hidden')})</span>
        )}
        <span className="ml-1.5 font-mono text-[10px] text-slate-400">{entry.field.id}</span>
      </dt>
      <dd className="text-sm">
        <Value entry={entry} />
        {entry.kind === 'answer' && entry.failed && entry.failNote && (
          <p className="mt-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">
            ⚠ {entry.failNote}
          </p>
        )}
        <Files files={files} />
      </dd>
    </div>
  );
}

const TONE = { ok: 'text-emerald-700', fail: 'text-amber-700', plain: '', empty: '' };

function Value({ entry }: { entry: Entry }) {
  if (entry.kind === 'table') return <Table table={entry.table} />;
  if (entry.kind !== 'answer') return null; // signature and photo notes: their files say it
  if (entry.empty) return <span className="text-slate-300">—</span>;
  if (entry.isOption)
    return <span className={`font-medium ${TONE[entry.tone]}`}>{entry.text}</span>;
  return <span className="whitespace-pre-wrap text-slate-800">{entry.text}</span>;
}

function Table({ table }: { table: TableView }) {
  if (table.empty) return <span className="text-slate-300">—</span>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-max border-collapse text-xs">
        <thead>
          <tr className="text-slate-500">
            {table.rowHeads && <th className="border-b border-slate-200 px-2 py-1" />}
            {table.columns.map((c) => (
              <th key={c.id} className="border-b border-slate-200 px-2 py-1 text-left">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r, i) => (
            <tr key={i}>
              {table.rowHeads && (
                <th className="border-b border-slate-100 px-2 py-1 text-left font-normal whitespace-nowrap text-slate-500">
                  {r.head}
                </th>
              )}
              {r.cells.map((text, j) => (
                <td key={table.columns[j].id} className="border-b border-slate-100 px-2 py-1">
                  {text}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Files({ files }: { files: Attachment[] }) {
  if (!files.length) return null;
  return (
    <ul className="mt-1.5 flex flex-wrap gap-1.5">
      {files.map((f) => (
        <li key={f.id}>
          <a href={`/api/files/${f.id}`} target="_blank" rel="noreferrer">
            {f.mime.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/files/${f.id}`}
                alt={f.filename ?? ''}
                className="h-16 w-16 rounded border border-slate-200 object-cover"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded border border-slate-200 bg-slate-50 text-[10px] text-slate-500">
                {f.filename ?? 'file'}
              </span>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}

function Stat({ label: l, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-slate-400 uppercase">{l}</dt>
      <dd className="mt-0.5 font-medium text-slate-800">{children}</dd>
    </div>
  );
}

function fmt(d: Date | null, lang: Lang) {
  if (!d) return '—';
  return new Intl.DateTimeFormat(dateLocale(lang), {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(d);
}
