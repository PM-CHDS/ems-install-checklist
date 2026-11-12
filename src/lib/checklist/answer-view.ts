/**
 * What a reader of a filled-in form sees: which fields apply, what each answer
 * says in words, which checks failed, and what each table row is. The admin view,
 * the PDF and the JSON export all lay out this one view, so they can't disagree
 * about visibility, failed checks or how a value is printed.
 *
 * Pure: snapshot + answers in, plain data out. Attachments stay with the caller —
 * how a photo is shown (thumbnail link, embedded image) is layout.
 */
import type {
  CompiledChecklist,
  CompiledColumn,
  CompiledField,
  CompiledSection,
  Lang,
} from './types';
import { help, label, title } from './types';
import {
  isFailed,
  isTableValue,
  isVisible,
  rowHasValue,
  summarize,
  visibleFixedRows,
  type FormState,
  type FormSummary,
} from './state';

/** How a printed value should be coloured: a passed check, a failed one, or neither. */
export type Tone = 'ok' | 'fail' | 'plain' | 'empty';

interface EntryBase {
  field: CompiledField;
  label: string;
  /** The field's gates are closed: the installer never saw it. Only with `includeHidden`. */
  hidden: boolean;
}

export type Entry =
  | (EntryBase & { kind: 'group' })
  | (EntryBase & { kind: 'note'; help?: string })
  | (EntryBase & {
      kind: 'answer';
      /** The value in words: option label, locale number with unit, long date. '—' when empty. */
      text: string;
      empty: boolean;
      tone: Tone;
      /** The value is one of the field's options (shown emphasised). */
      isOption: boolean;
      /** A visible blocking check answered with the failing option. */
      failed: boolean;
      /** The installer's explanation, trimmed; undefined when missing or not failed. */
      failNote?: string;
    })
  | (EntryBase & { kind: 'table'; table: TableView })
  | (EntryBase & { kind: 'signature' });

export interface TableView {
  columns: { id: string; label: string }[];
  /** Fixed-row tables carry a label per row; free tables don't. */
  rowHeads: boolean;
  /** Rows the installer saw. Fixed rows keep their order; blank free rows are dropped. */
  rows: { head: string; cells: string[] }[];
  /** No row holds anything. */
  empty: boolean;
}

export interface SectionView {
  section: CompiledSection;
  title: string;
  entries: Entry[];
}

export interface FailedCheck {
  field: CompiledField;
  label: string;
  failNote?: string;
}

export interface AnswerView {
  summary: FormSummary;
  /** Visible blocking checks answered NE, in form order. Same set as `summary.failedChecks`. */
  failedChecks: FailedCheck[];
  sections: SectionView[];
}

export interface ViewOptions {
  /** Keep fields whose gates are closed, flagged `hidden` (the admin's audit view). */
  includeHidden?: boolean;
}

export function viewAnswers(
  checklist: CompiledChecklist,
  state: FormState,
  lang: Lang,
  opts: ViewOptions = {},
): AnswerView {
  const summary = summarize(checklist, state);
  const failedChecks: FailedCheck[] = [];

  const sections = checklist.sections.map((section) => {
    const entries: Entry[] = [];
    for (const field of section.fields) {
      const hidden = !isVisible(field, state.values);
      if (hidden && !opts.includeHidden) continue;
      const entry = viewField(field, state, lang, hidden);
      if (entry.kind === 'answer' && entry.failed)
        failedChecks.push({ field, label: entry.label, failNote: entry.failNote });
      entries.push(entry);
    }
    return { section, title: title(section, lang), entries };
  });

  return { summary, failedChecks, sections };
}

function viewField(
  field: CompiledField,
  state: FormState,
  lang: Lang,
  hidden: boolean,
): Entry {
  const base = { field, label: label(field, lang), hidden };
  if (field.type === 'group') return { ...base, kind: 'group' };
  if (field.type === 'note') return { ...base, kind: 'note', help: help(field, lang) };
  if (field.type === 'signature') return { ...base, kind: 'signature' };

  const value = state.values[field.id];
  if (field.type === 'table') return { ...base, kind: 'table', table: viewTable(field, value, state, lang) };

  const empty = isEmpty(value);
  // A check that failed under a gate that has since closed no longer counts.
  const failed = !hidden && isFailed(field, value);
  const isOption = !empty && !!field.options?.some((o) => o.value === value);
  return {
    ...base,
    kind: 'answer',
    text: formatAnswer(field, value, lang),
    empty,
    tone: empty ? 'empty' : value === false ? 'fail' : value === true ? 'ok' : 'plain',
    isOption,
    failed,
    failNote: failed ? state.failNotes[field.id]?.trim() || undefined : undefined,
  };
}

function viewTable(field: CompiledField, value: unknown, state: FormState, lang: Lang): TableView {
  const cols = field.columns ?? [];
  const stored = isTableValue(value) ? value.rows : [];
  // Fixed rows are positional (row 2 = MaR1): each keeps its slot and its label, and
  // only the rows the installer saw are shown. Free tables drop blank rows.
  const picked = field.fixedRows
    ? visibleFixedRows(field, state.values).map(({ row, index }) => ({
        head: label(row, lang),
        cells: stored[index] ?? {},
      }))
    : stored.filter(rowHasValue).map((cells) => ({ head: '', cells }));

  return {
    columns: cols.map((c) => ({ id: c.id, label: label(c, lang) })),
    rowHeads: !!field.fixedRows,
    rows: picked.map((r) => ({
      head: r.head,
      cells: cols.map((c) => (isEmpty(r.cells[c.id]) ? '' : formatAnswer(c, r.cells[c.id], lang))),
    })),
    empty: !picked.some((r) => rowHasValue(r.cells)),
  };
}

const isEmpty = (v: unknown) => v === undefined || v === null || v === '';

/**
 * One answer in words, for a field or a table column: the option's label, a locale
 * number with its unit (3,2 in Czech), a long date. '—' when there's no answer.
 */
export function formatAnswer(
  def: Pick<CompiledField | CompiledColumn, 'type' | 'options' | 'unit'>,
  value: unknown,
  lang: Lang,
): string {
  if (isEmpty(value)) return '—';
  const opt = def.options?.find((o) => o.value === value);
  if (opt) return label(opt, lang);
  const locale = lang === 'en' ? 'en-GB' : 'cs-CZ';
  if (def.type === 'date' && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(
      new Date(Date.UTC(y, m - 1, d)),
    );
  }
  if (def.type === 'number') {
    const n = typeof value === 'number' ? value : Number(value);
    // Anything that isn't a plain number is shown as typed.
    const text = Number.isFinite(n)
      ? new Intl.NumberFormat(locale, { maximumFractionDigits: 6, useGrouping: false }).format(n)
      : String(value);
    return def.unit ? `${text} ${def.unit}` : text;
  }
  return String(value);
}
