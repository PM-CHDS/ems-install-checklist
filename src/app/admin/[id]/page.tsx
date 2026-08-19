import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { listEvents, loadById } from '@/lib/instances';
import {
  isFailed,
  isTableValue,
  isVisible,
  summarize,
  visibleFixedRows,
  type FormState,
} from '@/lib/checklist/state';
import {
  caption,
  isInput,
  label,
  type CompiledField,
  type Lang,
} from '@/lib/checklist/types';
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
  const summary = summarize(checklist, state);
  const url = `${process.env.PUBLIC_BASE_URL ?? ''}/f/${instance.token}`;

  const filesByField = new Map<string, Attachment[]>();
  for (const a of attachments) {
    const list = filesByField.get(a.fieldId) ?? [];
    list.push(a);
    filesByField.set(a.fieldId, list);
  }

  const failedFields = checklist.sections
    .flatMap((s) => s.fields)
    .filter((f) => isFailed(f, state.values[f.id]));

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
              {lang === 'en' ? checklist.titleEn : checklist.titleCs} ·{' '}
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
            <span className={failedFields.length ? 'text-amber-700' : ''}>
              {failedFields.length}
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

      {failedFields.length > 0 && (
        <section className="card mt-6 border-amber-300 p-5">
          <h2 className="text-sm font-semibold text-amber-900">
            ⚠ {t(lang, 'admin.failedChecks')} ({failedFields.length})
          </h2>
          <ul className="mt-2 divide-y divide-amber-100">
            {failedFields.map((f) => (
              <li key={f.id} className="py-2">
                <p className="text-sm font-medium text-slate-800">{label(f, lang)}</p>
                <p className="mt-0.5 text-sm text-slate-600">
                  {state.failNotes[f.id]?.trim() || (
                    <em className="text-rose-600">{t(lang, 'admin.noExplanation')}</em>
                  )}
                </p>
                <Files files={filesByField.get(f.id) ?? []} />
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
          {checklist.sections.map((section) => (
            <div key={section.id} className="card overflow-hidden">
              <h3 className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700">
                {lang === 'en' ? section.titleEn : section.titleCs}
              </h3>
              <dl className="divide-y divide-slate-100">
                {section.fields
                  .filter((f) => isInput(f) || f.photo)
                  .map((f) => (
                    <AnswerRow
                      key={f.id}
                      field={f}
                      state={state}
                      files={filesByField.get(f.id) ?? []}
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
  field,
  state,
  files,
  lang,
}: {
  field: CompiledField;
  state: FormState;
  files: Attachment[];
  lang: Lang;
}) {
  const value = state.values[field.id];
  const visible = isVisible(field, state.values);
  const failed = isFailed(field, value);

  return (
    <div
      className={`grid gap-1 px-4 py-2.5 sm:grid-cols-[1fr_1.2fr] ${
        failed ? 'bg-amber-50/60' : ''
      } ${visible ? '' : 'opacity-50'}`}
    >
      <dt className="text-sm text-slate-600">
        {label(field, lang)}
        {!visible && (
          <span className="ml-1 text-xs text-slate-400">({t(lang, 'admin.hidden')})</span>
        )}
        <span className="ml-1.5 font-mono text-[10px] text-slate-400">{field.id}</span>
      </dt>
      <dd className="text-sm">
        <Value field={field} value={value} values={state.values} lang={lang} />
        {failed && state.failNotes[field.id] && (
          <p className="mt-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">
            ⚠ {state.failNotes[field.id]}
          </p>
        )}
        <Files files={files} />
      </dd>
    </div>
  );
}

function Value({
  field,
  value,
  values,
  lang,
}: {
  field: CompiledField;
  value: unknown;
  values: Record<string, unknown>;
  lang: Lang;
}) {
  if (value === undefined || value === null || value === '')
    return <span className="text-slate-300">—</span>;

  if (field.type === 'table' && isTableValue(value)) {
    const cols = field.columns ?? [];
    const fixed = field.fixedRows;
    const nonEmpty = (r: Record<string, unknown>) =>
      Object.values(r).some((c) => c !== null && c !== undefined && String(c).trim() !== '');
    // A fixed-row table's meaning is positional (row 2 = MaR1), so its rows are kept
    // in place and shown with their labels; only free-form tables drop blank rows.
    // Same gating the installer saw: a row that didn't apply isn't shown here either.
    const rows = fixed
      ? visibleFixedRows(field, values).map(({ row, index }) => ({
          row: value.rows[index] ?? {},
          label: label(row, lang),
        }))
      : value.rows.filter(nonEmpty).map((r) => ({ row: r, label: '' }));
    if (!rows.some((r) => nonEmpty(r.row))) return <span className="text-slate-300">—</span>;
    return (
      <div className="overflow-x-auto">
        <table className="min-w-max border-collapse text-xs">
          <thead>
            <tr className="text-slate-500">
              {fixed && <th className="border-b border-slate-200 px-2 py-1" />}
              {cols.map((c) => (
                <th key={c.id} className="border-b border-slate-200 px-2 py-1 text-left">
                  {label(c, lang)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {fixed && (
                  <th className="border-b border-slate-100 px-2 py-1 text-left font-normal whitespace-nowrap text-slate-500">
                    {r.label}
                  </th>
                )}
                {cols.map((c) => (
                  <td key={c.id} className="border-b border-slate-100 px-2 py-1">
                    {r.row[c.id] === null || r.row[c.id] === undefined
                      ? ''
                      : String(r.row[c.id])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (field.options) {
    const opt = field.options.find((o) => o.value === value);
    if (opt)
      return (
        <span
          className={`font-medium ${
            value === false ? 'text-amber-700' : value === true ? 'text-emerald-700' : ''
          }`}
        >
          {label(opt, lang)}
        </span>
      );
  }

  return <span className="whitespace-pre-wrap text-slate-800">{String(value)}</span>;
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
