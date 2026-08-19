/**
 * Visibility, completeness and blocking rules. Shared by the browser (live UI
 * feedback) and the server (authoritative check at submit time), so the two can
 * never disagree about whether a form is ready.
 */
import type {
  CompiledChecklist,
  CompiledField,
  CompiledSection,
  Lang,
  OptionValue,
} from './types';
import { isInput, label, onFailPolicy } from './types';

export interface FormState {
  values: Record<string, unknown>;
  failNotes: Record<string, string | null | undefined>;
  photoCounts: Record<string, number>;
}

export const emptyState = (): FormState => ({
  values: {},
  failNotes: {},
  photoCounts: {},
});

export type TableValue = { rows: Record<string, unknown>[] };

export function isTableValue(v: unknown): v is TableValue {
  return !!v && typeof v === 'object' && Array.isArray((v as TableValue).rows);
}

function eq(a: unknown, b: OptionValue | number): boolean {
  if (a === b) return true;
  if (a === null || a === undefined) return false;
  // number/string mismatches come from YAML vs form input; compare textually
  if (typeof a === 'number' || typeof b === 'number') return String(a) === String(b);
  return false;
}

/** A field is shown only when its `conditional_on` gate matches the current answer. */
export function isVisible(field: CompiledField, values: Record<string, unknown>): boolean {
  const c = field.conditionalOn;
  if (!c) return true;
  const value = values[c.field];
  if (c.gt !== undefined) {
    // An unanswered or non-numeric gate keeps the field hidden: asking about
    // switchboards before knowing whether there are any is noise.
    const n = typeof value === 'number' ? value : Number(value);
    return value !== null && value !== undefined && value !== '' && Number.isFinite(n) && n > c.gt;
  }
  // The compiler guarantees exactly one operator is set.
  return c.equals !== undefined && eq(value, c.equals);
}

/** Does this field hold a real answer? */
export function hasValue(field: CompiledField, value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false;
  if (field.type === 'table') {
    if (!isTableValue(value)) return false;
    return value.rows.some((row) =>
      Object.values(row).some((c) => c !== undefined && c !== null && String(c).trim() !== ''),
    );
  }
  if (typeof value === 'string') return value.trim() !== '';
  return true;
}

/** A blocking check answered with the failing option. */
export function isFailed(field: CompiledField, value: unknown): boolean {
  return !!field.blocking && value === false;
}

export type ProblemCode =
  | 'required'
  | 'fail_note'
  | 'fail_photo'
  | 'photo_required';

export interface Problem {
  fieldId: string;
  sectionId: string;
  code: ProblemCode;
}

/**
 * Everything wrong with one field right now. A failed blocking check is not itself
 * a problem — the *missing explanation* for it is. That's the "require note + photo,
 * flag the form, but let the installer carry on" policy.
 */
export function fieldProblems(field: CompiledField, state: FormState): Problem[] {
  if (!isInput(field) && !field.photo) return [];
  if (!isVisible(field, state.values)) return [];

  const out: Problem[] = [];
  const value = state.values[field.id];
  const photos = state.photoCounts[field.id] ?? 0;
  const p = (code: ProblemCode) =>
    out.push({ fieldId: field.id, sectionId: field.sectionId, code });

  if (isFailed(field, value)) {
    const policy = onFailPolicy(field)!;
    if (policy.requireNote && !state.failNotes[field.id]?.trim()) p('fail_note');
    if (policy.requirePhoto && photos === 0) p('fail_photo');
    return out;
  }

  if (isInput(field) && field.required && !hasValue(field, value)) p('required');
  // Photo evidence is only demanded once the check itself is answered — asking for
  // a photo of something not yet reported would just be noise.
  if (field.photoRequired && photos === 0 && (!isInput(field) || hasValue(field, value)))
    p('photo_required');

  return out;
}

export interface SectionProgress {
  sectionId: string;
  /** Visible fields that need an answer. */
  total: number;
  answered: number;
  problems: Problem[];
  failedChecks: string[];
  complete: boolean;
}

export function sectionProgress(
  section: CompiledSection,
  state: FormState,
): SectionProgress {
  let total = 0;
  let answered = 0;
  const problems: Problem[] = [];
  const failedChecks: string[] = [];

  for (const f of section.fields) {
    if (!isVisible(f, state.values)) continue;
    if (isInput(f) && f.required) {
      total += 1;
      if (hasValue(f, state.values[f.id])) answered += 1;
    }
    if (isFailed(f, state.values[f.id])) failedChecks.push(f.id);
    problems.push(...fieldProblems(f, state));
  }

  return {
    sectionId: section.id,
    total,
    answered,
    problems,
    failedChecks,
    complete: problems.length === 0,
  };
}

export interface FormSummary {
  sections: SectionProgress[];
  total: number;
  answered: number;
  /** 0-100, of required visible fields. */
  percent: number;
  problems: Problem[];
  failedChecks: string[];
  /** True when nothing stands in the way of submitting. */
  canSubmit: boolean;
}

export function summarize(
  checklist: CompiledChecklist,
  state: FormState,
): FormSummary {
  const sections = checklist.sections.map((s) => sectionProgress(s, state));
  const total = sections.reduce((a, s) => a + s.total, 0);
  const answered = sections.reduce((a, s) => a + s.answered, 0);
  const problems = sections.flatMap((s) => s.problems);
  const failedChecks = sections.flatMap((s) => s.failedChecks);
  return {
    sections,
    total,
    answered,
    percent: total === 0 ? 100 : Math.round((answered / total) * 100),
    problems,
    failedChecks,
    canSubmit: problems.length === 0,
  };
}

/** Human-readable description of a problem, for the review screen. */
export function problemText(
  problem: Problem,
  field: CompiledField,
  lang: Lang,
): string {
  const name = label(field, lang);
  const cs = lang === 'cs';
  switch (problem.code) {
    case 'required':
      return cs ? `Nevyplněno: ${name}` : `Not filled in: ${name}`;
    case 'fail_note':
      return cs
        ? `Chybí vysvětlení u neproběhlého kroku: ${name}`
        : `Missing explanation for the failed step: ${name}`;
    case 'fail_photo':
      return cs
        ? `Chybí fotodokumentace u neproběhlého kroku: ${name}`
        : `Missing photo for the failed step: ${name}`;
    case 'photo_required':
      return cs ? `Chybí fotodokumentace: ${name}` : `Missing photo documentation: ${name}`;
  }
}

/**
 * Status a form should carry given its answers. `submitted`/`reviewed` are terminal
 * and set explicitly, so they're never recomputed here.
 */
export function derivedStatus(
  state: FormState,
  checklist: CompiledChecklist,
): 'created' | 'in_progress' | 'issues' {
  const anyAnswer = checklist.sections
    .flatMap((s) => s.fields)
    .some((f) => hasValue(f, state.values[f.id]));
  const anyFailed = checklist.sections
    .flatMap((s) => s.fields)
    .some((f) => isVisible(f, state.values) && isFailed(f, state.values[f.id]));
  if (anyFailed) return 'issues';
  return anyAnswer ? 'in_progress' : 'created';
}
