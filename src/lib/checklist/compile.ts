/**
 * Reads `checklists/<slug>/` (checklist.yaml + one markdown file per section, each
 * holding a fenced ```yaml block with a `fields:` list) and compiles it into the
 * CompiledChecklist consumed by the app.
 *
 * Node-only: uses fs. The running app never calls this — it reads the compiled JSON
 * snapshot stored on the form instance.
 */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { z } from 'zod';
import type {
  CompiledChecklist,
  CompiledColumn,
  CompiledField,
  CompiledOption,
  CompiledSection,
  FieldType,
} from './types';
import { INPUT_TYPES } from './types';

export const COMPILER_VERSION = '1';

/* ------------------------------------------------------- raw (authored) shape */

const bilingualLabel = z.object({
  label_cs: z.string().min(1),
  label_en: z.string().min(1),
});

const rawSelectOption = bilingualLabel.extend({
  value: z.union([z.string(), z.boolean(), z.number()]),
});

/** `options: {true: {cs: "ANO", en: "Yes"}, false: {...}}` — the boolean shorthand. */
const rawBooleanOptions = z.object({
  true: z.object({ cs: z.string(), en: z.string() }),
  false: z.object({ cs: z.string(), en: z.string() }),
});

const rawImage = z.object({
  file: z.string().min(1),
  caption_cs: z.string().optional(),
  caption_en: z.string().optional(),
});

const rawColumn = bilingualLabel.extend({
  id: z.string().regex(/^[a-z0-9_]+$/),
  type: z.enum(['text', 'number', 'select', 'date']).default('text'),
  unit: z.string().optional(),
  help_cs: z.string().optional(),
  help_en: z.string().optional(),
  options: z.array(rawSelectOption).optional(),
});

const rawFixedRow = bilingualLabel.extend({
  row_id: z.string().regex(/^[a-z0-9_]+$/),
});

const rawOnFail = z.object({
  require_note: z.boolean().default(true),
  require_photo: z.boolean().default(false),
});

const rawField = z
  .object({
    id: z.string().regex(/^[a-z0-9_]+$/, 'field id must be snake_case'),
    type: z.enum([
      'text',
      'number',
      'boolean',
      'select',
      'date',
      'signature',
      'table',
      'note',
      'group',
    ]),
    label_cs: z.string().optional(),
    label_en: z.string().optional(),
    help_cs: z.string().optional(),
    help_en: z.string().optional(),
    multiline: z.boolean().optional(),
    unit: z.union([z.string(), z.number()]).optional(),
    required: z.boolean().optional(),
    severity: z.literal('warning').optional(),
    options: z.union([z.array(rawSelectOption), rawBooleanOptions]).optional(),
    images: z.array(rawImage).optional(),
    conditional_on: z
      .object({
        field: z.string(),
        equals: z.union([z.string(), z.boolean(), z.number()]).optional(),
        gt: z.number().optional(),
      })
      .refine((c) => (c.equals === undefined) !== (c.gt === undefined), {
        message: 'conditional_on needs exactly one of `equals` or `gt`',
      })
      .optional(),
    blocking: z.boolean().optional(),
    on_fail: rawOnFail.optional(),
    photo: z.boolean().optional(),
    photo_required: z.boolean().optional(),
    repeatable: z.boolean().optional(),
    suggested_rows: z.number().int().positive().optional(),
    columns: z.array(rawColumn).optional(),
    fixed_rows: z.array(rawFixedRow).optional(),
  })
  .strict();

const rawSectionBlock = z.object({ fields: z.array(rawField).min(1) });

const rawMeta = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  version: z.number().int().positive(),
  title_cs: z.string(),
  title_en: z.string(),
  subtitle_cs: z.string().optional(),
  subtitle_en: z.string().optional(),
  source_document: z.string().optional(),
  author_org: z.string().optional(),
  default_language: z.enum(['cs', 'en']).default('cs'),
  submission_contact: z
    .object({
      email: z.string().optional(),
      person: z.string().optional(),
      phone: z.string().optional(),
      person_email: z.string().optional(),
    })
    .optional(),
  sections: z
    .array(
      z.object({
        file: z.string(),
        id: z.string().regex(/^[a-z0-9_-]+$/),
        title_cs: z.string(),
        title_en: z.string(),
      }),
    )
    .min(1),
});

/* ------------------------------------------------------------------ compiling */

export class SchemaError extends Error {}

function fail(where: string, msg: string): never {
  throw new SchemaError(`${where}: ${msg}`);
}

/** Pull the first fenced ```yaml block out of a markdown file. */
function extractYamlBlock(md: string, where: string): string {
  const m = md.match(/^```ya?ml\s*\n([\s\S]*?)^```\s*$/m);
  if (!m) fail(where, 'no fenced ```yaml block with the `fields:` list found');
  return m[1];
}

/**
 * Intro prose: the leading blockquote(s) of a section file, before the yaml block.
 * Maintainer-only `_notes` blockquotes are skipped — they aren't shown to installers.
 * Czech text is the source; a parenthesised *(...)* italic line is its translation.
 */
function extractIntro(md: string): { cs?: string; en?: string } {
  const beforeYaml = md.split(/^```ya?ml/m)[0];
  const quotes = beforeYaml
    .split(/\n\s*\n/)
    .filter((b) => b.trimStart().startsWith('>'))
    .map((b) =>
      b
        .split('\n')
        .map((l) => l.replace(/^\s*>\s?/, ''))
        .join('\n')
        .trim(),
    )
    .filter((b) => b && !b.startsWith('**_notes**'));
  if (!quotes.length) return {};
  const joined = quotes.join('\n\n');
  // Split the Czech source text from the *(English gloss)* that follows it.
  const parts = joined.split(/\n\s*\n/);
  const cs: string[] = [];
  const en: string[] = [];
  for (const p of parts) {
    const flat = p.replace(/\s+/g, ' ').trim();
    if (/^\*\(.*\)\*?$/s.test(flat) || /^\*\(/.test(flat)) {
      en.push(flat.replace(/^\*\(/, '').replace(/\)\*/, '').trim());
    } else {
      cs.push(flat);
    }
  }
  return {
    cs: cs.join('\n\n') || undefined,
    en: (en.length ? en : cs).join('\n\n') || undefined,
  };
}

function normalizeOptions(
  raw: unknown,
  type: FieldType,
  where: string,
): CompiledOption[] | undefined {
  if (raw === undefined) return undefined;
  if (Array.isArray(raw)) {
    return raw.map((o) => {
      const opt = o as z.infer<typeof rawSelectOption>;
      return {
        value: typeof opt.value === 'number' ? String(opt.value) : opt.value,
        labelCs: opt.label_cs,
        labelEn: opt.label_en,
      };
    });
  }
  // boolean shorthand — YAML turns `true:`/`false:` keys into booleans or strings
  const o = raw as Record<string, { cs: string; en: string }>;
  const yes = o['true'] ?? (o as Record<string, never>)[String(true)];
  const no = o['false'] ?? (o as Record<string, never>)[String(false)];
  if (!yes || !no) fail(where, 'boolean `options` must define both true and false');
  if (type !== 'boolean')
    fail(where, 'the {true:…,false:…} options shorthand is only valid for type: boolean');
  return [
    { value: true, labelCs: yes.cs, labelEn: yes.en },
    { value: false, labelCs: no.cs, labelEn: no.en },
  ];
}

function compileColumn(c: z.infer<typeof rawColumn>, where: string): CompiledColumn {
  if (c.type === 'select' && (!c.options || c.options.length < 2))
    fail(`${where} → column ${c.id}`, 'a select column needs at least 2 options');
  return {
    id: c.id,
    labelCs: c.label_cs,
    labelEn: c.label_en,
    type: c.type,
    unit: c.unit,
    helpCs: c.help_cs,
    helpEn: c.help_en,
    options: normalizeOptions(c.options, 'select', `${where} → column ${c.id}`),
  };
}

function compileField(
  raw: z.infer<typeof rawField>,
  sectionId: string,
  assetUrlBase: string,
  assetDir: string,
  where: string,
): CompiledField {
  const w = `${where} → field \`${raw.id}\``;
  const labelCs = raw.label_cs ?? raw.label_en;
  const labelEn = raw.label_en ?? raw.label_cs;
  if (!labelCs || !labelEn) fail(w, 'needs at least one of label_cs / label_en');

  if (raw.blocking && raw.type !== 'boolean')
    fail(w, '`blocking` is only meaningful on a boolean check');
  if (raw.on_fail && !raw.blocking) fail(w, '`on_fail` requires `blocking: true`');
  if (raw.photo_required && !raw.photo)
    fail(w, '`photo_required` requires `photo: true`');
  if (raw.type === 'boolean' && !raw.options)
    fail(w, 'a boolean field must declare its ANO/NE `options`');
  if (raw.type === 'select' && (!Array.isArray(raw.options) || raw.options.length < 2))
    fail(w, 'a select field needs at least 2 options');
  if (raw.type === 'table') {
    if (!raw.columns?.length) fail(w, 'a table needs `columns`');
    if (raw.repeatable === false && !raw.fixed_rows?.length)
      fail(w, 'a non-repeatable table needs `fixed_rows`');
    const seen = new Set<string>();
    for (const c of raw.columns) {
      if (seen.has(c.id)) fail(w, `duplicate column id \`${c.id}\``);
      seen.add(c.id);
    }
  } else if (raw.columns || raw.fixed_rows || raw.repeatable !== undefined) {
    fail(w, 'table-only keys (columns/fixed_rows/repeatable) on a non-table field');
  }

  const images = raw.images?.map((img) => {
    const rel = img.file.replace(/^assets\//, '');
    const abs = path.join(assetDir, rel);
    if (!fs.existsSync(abs)) fail(w, `image not found: ${img.file}`);
    return {
      src: `${assetUrlBase}/${rel}`,
      captionCs: img.caption_cs,
      captionEn: img.caption_en,
    };
  });

  const isInputField = INPUT_TYPES.includes(raw.type);

  return {
    id: raw.id,
    sectionId,
    type: raw.type,
    labelCs,
    labelEn,
    helpCs: raw.help_cs?.trim(),
    helpEn: raw.help_en?.trim(),
    multiline: raw.multiline,
    unit: raw.unit === undefined ? undefined : String(raw.unit),
    required: isInputField ? (raw.required ?? true) : false,
    options: normalizeOptions(raw.options, raw.type, w),
    images,
    severity: raw.severity,
    conditionalOn: raw.conditional_on
      ? {
          field: raw.conditional_on.field,
          equals: raw.conditional_on.equals,
          gt: raw.conditional_on.gt,
        }
      : undefined,
    blocking: raw.blocking,
    onFail: raw.on_fail
      ? { requireNote: raw.on_fail.require_note, requirePhoto: raw.on_fail.require_photo }
      : undefined,
    photo: raw.photo,
    photoRequired: raw.photo_required,
    repeatable: raw.repeatable,
    suggestedRows: raw.suggested_rows,
    columns: raw.columns?.map((c) => compileColumn(c, w)),
    fixedRows: raw.fixed_rows?.map((r) => ({
      rowId: r.row_id,
      labelCs: r.label_cs,
      labelEn: r.label_en,
    })),
  };
}

export interface CompileResult {
  checklist: CompiledChecklist;
  assetDir: string;
  assetUrlBase: string;
}

export function compileChecklist(dir: string): CompileResult {
  const metaPath = path.join(dir, 'checklist.yaml');
  if (!fs.existsSync(metaPath))
    fail(dir, 'missing checklist.yaml');
  const metaParsed = rawMeta.safeParse(YAML.parse(fs.readFileSync(metaPath, 'utf8')));
  if (!metaParsed.success)
    fail('checklist.yaml', formatZod(metaParsed.error));
  const meta = metaParsed.data;

  const assetDir = path.join(dir, 'assets');
  const assetUrlBase = `/checklists/${meta.slug}/assets`;

  const sections: CompiledSection[] = [];
  for (const s of meta.sections) {
    const file = path.join(dir, s.file);
    if (!fs.existsSync(file)) fail('checklist.yaml', `section file not found: ${s.file}`);
    const md = fs.readFileSync(file, 'utf8');
    const yamlText = extractYamlBlock(md, s.file);
    let doc: unknown;
    try {
      doc = YAML.parse(yamlText);
    } catch (e) {
      fail(s.file, `invalid YAML: ${(e as Error).message}`);
    }
    const parsed = rawSectionBlock.safeParse(doc);
    if (!parsed.success) fail(s.file, formatZod(parsed.error));
    const intro = extractIntro(md);
    sections.push({
      id: s.id,
      titleCs: s.title_cs,
      titleEn: s.title_en,
      introCs: intro.cs,
      introEn: intro.en,
      fields: parsed.data.fields.map((f) =>
        compileField(f, s.id, assetUrlBase, assetDir, s.file),
      ),
    });
  }

  // --- cross-field validation -------------------------------------------------
  const byId = new Map<string, CompiledField>();
  for (const sec of sections) {
    for (const f of sec.fields) {
      if (byId.has(f.id))
        fail(
          'checklist',
          `duplicate field id \`${f.id}\` (in ${byId.get(f.id)!.sectionId} and ${sec.id})`,
        );
      byId.set(f.id, f);
    }
  }
  const order = [...byId.keys()];
  for (const f of byId.values()) {
    const c = f.conditionalOn;
    if (!c) continue;
    const target = byId.get(c.field);
    if (!target)
      fail(
        `field \`${f.id}\``,
        `conditional_on references unknown field \`${c.field}\``,
      );
    if (order.indexOf(c.field) > order.indexOf(f.id))
      fail(
        `field \`${f.id}\``,
        `conditional_on references \`${c.field}\`, which appears later in the form`,
      );
    if (c.gt !== undefined) {
      if (target.type !== 'number')
        fail(
          `field \`${f.id}\``,
          `conditional_on uses \`gt\`, which needs a number field, but ` +
            `\`${c.field}\` is type ${target.type}`,
        );
    } else if (target.options) {
      const values = target.options.map((o) => o.value);
      // Numeric option values are normalized to strings during compilation, so
      // compare textually rather than failing a schema that is actually valid.
      if (!values.some((v) => v === c.equals || String(v) === String(c.equals)))
        fail(
          `field \`${f.id}\``,
          `conditional_on equals \`${String(c.equals)}\`, which is not an option of ` +
            `\`${c.field}\` (has: ${values.map(String).join(', ')})`,
        );
    }
  }

  return {
    checklist: {
      slug: meta.slug,
      version: meta.version,
      titleCs: meta.title_cs,
      titleEn: meta.title_en,
      subtitleCs: meta.subtitle_cs,
      subtitleEn: meta.subtitle_en,
      sourceDocument: meta.source_document,
      authorOrg: meta.author_org,
      defaultLanguage: meta.default_language,
      submissionContact: meta.submission_contact
        ? {
            email: meta.submission_contact.email,
            person: meta.submission_contact.person,
            phone: meta.submission_contact.phone,
            personEmail: meta.submission_contact.person_email,
          }
        : undefined,
      sections,
      compiledWith: `compiler-v${COMPILER_VERSION}`,
    },
    assetDir,
    assetUrlBase,
  };
}

function formatZod(err: z.ZodError): string {
  return err.issues
    .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('; ');
}

/** All checklist directories in `checklists/`. */
export function discoverChecklists(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(root, d.name, 'checklist.yaml')))
    .map((d) => path.join(root, d.name));
}
