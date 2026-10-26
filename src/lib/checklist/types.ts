/**
 * The compiled checklist shape. This is what the form renderer, the validator and
 * the admin view all consume. It is produced from the markdown + YAML section files
 * in `checklists/<slug>/` by `scripts/compile-schema.ts`, and snapshotted into each
 * form instance row so an in-flight form never changes under the installer.
 */

export type Lang = 'cs' | 'en';

export type FieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'date'
  | 'signature'
  | 'table'
  | 'note'
  | 'group';

/** Types that hold an answer (as opposed to display-only chrome). */
export const INPUT_TYPES: FieldType[] = [
  'text',
  'number',
  'boolean',
  'select',
  'date',
  'signature',
  'table',
];

export type OptionValue = string | boolean;

export interface CompiledOption {
  value: OptionValue;
  labelCs: string;
  labelEn: string;
}

export interface CompiledImage {
  src: string;
  captionCs?: string;
  captionEn?: string;
}

export interface CompiledColumn {
  id: string;
  labelCs: string;
  labelEn: string;
  type: 'text' | 'number' | 'select' | 'date';
  unit?: string;
  helpCs?: string;
  helpEn?: string;
  options?: CompiledOption[];
}

/**
 * A gate on another field's answer. Exactly one operator is set:
 *   equals — the answer matches this value
 *   gt     — a numeric answer is greater than this (e.g. "only if the count isn't 0")
 */
export interface CompiledCondition {
  field: string;
  equals?: OptionValue | number;
  gt?: number;
}

/**
 * Shown when at least one alternative holds; each alternative is a list of
 * conditions that must all hold (a condition plus the chain its target needs).
 */
export interface CompiledAnyOf {
  anyOf: CompiledCondition[][];
}

/** One entry of a `visibleWhen` list: a plain condition or an either/or group. */
export type CompiledGate = CompiledCondition | CompiledAnyOf;

export interface CompiledFixedRow {
  rowId: string;
  labelCs: string;
  labelEn: string;
  /** Same gate vocabulary as a field's `conditionalOn`. */
  conditionalOn?: CompiledCondition;
  /** Same as a field's `visibleWhen`. */
  visibleWhen?: CompiledGate[];
}

export interface OnFail {
  requireNote: boolean;
  requirePhoto: boolean;
}

export interface CompiledField {
  id: string;
  sectionId: string;
  type: FieldType;
  labelCs: string;
  labelEn: string;
  helpCs?: string;
  helpEn?: string;
  /** long free text */
  multiline?: boolean;
  unit?: string;
  required: boolean;
  options?: CompiledOption[];
  images?: CompiledImage[];
  severity?: 'warning';
  /** The first of the field's own `conditional_on` gates. Kept for older readers. */
  conditionalOn?: CompiledCondition;
  /**
   * Every gate that must hold for the field to be shown: its own `conditional_on`
   * gates plus, transitively, those of the fields they point at — so hiding a gate
   * also hides everything nested under it. Absent on snapshots compiled before
   * nested gating existed; `conditionalOn` alone applies to those.
   */
  visibleWhen?: CompiledGate[];

  /** A `false` answer on this check is a failure that flags the whole form. */
  blocking?: boolean;
  /** What the installer must supply when a blocking check fails. */
  onFail?: OnFail;
  /** Photo attachments are offered on this field. */
  photo?: boolean;
  /** At least one photo is needed for this field to count as complete. */
  photoRequired?: boolean;

  // table only
  repeatable?: boolean;
  suggestedRows?: number;
  columns?: CompiledColumn[];
  fixedRows?: CompiledFixedRow[];
}

export interface CompiledSection {
  id: string;
  titleCs: string;
  titleEn: string;
  /** Intro prose from the section file's blockquote(s), if any. */
  introCs?: string;
  introEn?: string;
  fields: CompiledField[];
}

export interface SubmissionContact {
  email?: string;
  person?: string;
  phone?: string;
  personEmail?: string;
}

export interface CompiledChecklist {
  slug: string;
  version: number;
  titleCs: string;
  titleEn: string;
  subtitleCs?: string;
  subtitleEn?: string;
  sourceDocument?: string;
  authorOrg?: string;
  defaultLanguage: Lang;
  submissionContact?: SubmissionContact;
  sections: CompiledSection[];
  /** Compiler version + build stamp, for traceability of a snapshot. */
  compiledWith: string;
}

/* ------------------------------------------------------------------ helpers */

export function label(
  o: { labelCs: string; labelEn: string },
  lang: Lang,
): string {
  return (lang === 'en' ? o.labelEn : o.labelCs) || o.labelCs || o.labelEn;
}

export function help(
  o: { helpCs?: string; helpEn?: string },
  lang: Lang,
): string | undefined {
  return (lang === 'en' ? o.helpEn : o.helpCs) ?? o.helpCs ?? o.helpEn;
}

export function caption(o: CompiledImage, lang: Lang): string | undefined {
  return (lang === 'en' ? o.captionEn : o.captionCs) ?? o.captionCs;
}

export function isInput(f: CompiledField): boolean {
  return INPUT_TYPES.includes(f.type);
}

export function allFields(c: CompiledChecklist): CompiledField[] {
  return c.sections.flatMap((s) => s.fields);
}

export function fieldById(
  c: CompiledChecklist,
  id: string,
): CompiledField | undefined {
  return allFields(c).find((f) => f.id === id);
}

/** Default on-fail policy for a blocking check with no explicit override. */
export const DEFAULT_ON_FAIL: OnFail = { requireNote: true, requirePhoto: false };

export function onFailPolicy(f: CompiledField): OnFail | undefined {
  if (!f.blocking) return undefined;
  return f.onFail ?? DEFAULT_ON_FAIL;
}
