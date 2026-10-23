/**
 * Renders one form instance — every answer the installer could see, fail notes,
 * photos and the signature — as a PDF for the admin to file or send on.
 *
 * Server-only. Text is set in DejaVu Sans (bundled in assets/fonts) because
 * PDFKit's built-in fonts can't encode Czech diacritics.
 */
import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import type { Attachment } from '@/db/schema';
import type { LoadedInstance } from '@/lib/instances';
import { isFailed, isTableValue, isVisible, summarize, visibleFixedRows } from '@/lib/checklist/state';
import { help, isInput, label, type CompiledField, type Lang } from '@/lib/checklist/types';
import { storage } from '@/lib/storage';

const FONT_DIR = path.join(process.cwd(), 'assets', 'fonts');
const REGULAR = 'DejaVuSansCondensed.ttf';
const BOLD = 'DejaVuSansCondensed-Bold.ttf';

const PAGE_MARGIN = 40;
const LABEL_SHARE = 0.45;
const THUMB_W = 160;
const THUMB_H = 120;
const EMBEDDABLE = ['image/jpeg', 'image/png'];

const COLOR = {
  text: '#1e293b',
  muted: '#64748b',
  faint: '#cbd5e1',
  rule: '#e2e8f0',
  ok: '#047857',
  fail: '#b45309',
  failBg: '#fffbeb',
};

const STRINGS = {
  cs: {
    checklist: 'Checklist',
    status: 'Stav',
    created: 'Vytvořeno',
    submitted: 'Odesláno',
    generated: 'Vygenerováno',
    progress: 'Vyplněno',
    failedChecks: 'Neproběhlé kroky',
    explanation: 'Vysvětlení',
    noExplanation: 'chybí vysvětlení',
    attachment: 'Příloha',
    notEmbedded: 'nelze vložit do PDF, viz administrace',
    page: 'Strana',
    of: 'z',
    status_created: 'Nezahájeno',
    status_in_progress: 'Rozpracováno',
    status_issues: 'S výhradami',
    status_submitted: 'Odesláno',
    status_reviewed: 'Zkontrolováno',
  },
  en: {
    checklist: 'Checklist',
    status: 'Status',
    created: 'Created',
    submitted: 'Submitted',
    generated: 'Generated',
    progress: 'Completed',
    failedChecks: 'Steps that didn’t pass',
    explanation: 'Explanation',
    noExplanation: 'no explanation given',
    attachment: 'Attachment',
    notEmbedded: 'cannot be embedded in the PDF, see the admin panel',
    page: 'Page',
    of: 'of',
    status_created: 'Not started',
    status_in_progress: 'In progress',
    status_issues: 'Has issues',
    status_submitted: 'Submitted',
    status_reviewed: 'Reviewed',
  },
} as const;

type Doc = PDFKit.PDFDocument;

export async function renderFormPdf(loaded: LoadedInstance, lang: Lang): Promise<Buffer> {
  const { instance, checklist, state, attachments } = loaded;
  const s = STRINGS[lang];
  const locale = lang === 'en' ? 'en-GB' : 'cs-CZ';
  const when = (d: Date | null) =>
    d ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(d) : '—';

  const files = await loadFiles(attachments);

  const doc = new PDFDocument({
    size: 'A4',
    margin: PAGE_MARGIN,
    bufferPages: true,
    font: path.join(FONT_DIR, REGULAR),
    info: {
      Title: `${label({ labelCs: checklist.titleCs, labelEn: checklist.titleEn }, lang)} – ${instance.label}`,
      Author: checklist.authorOrg ?? '',
    },
  });
  doc.registerFont('R', path.join(FONT_DIR, REGULAR));
  doc.registerFont('B', path.join(FONT_DIR, BOLD));
  const done = collect(doc);

  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // --- header ---------------------------------------------------------------
  doc.font('B').fontSize(16).fillColor(COLOR.text)
    .text(lang === 'en' ? checklist.titleEn : checklist.titleCs, left, PAGE_MARGIN, { width });
  doc.font('R').fontSize(12).fillColor(COLOR.text).text(instance.label, { width });
  doc.moveDown(0.6);

  const summary = summarize(checklist, state);
  const meta: [string, string][] = [
    [s.checklist, `${instance.checklistSlug} v${instance.checklistVersion}`],
    [s.status, s[`status_${instance.status}` as keyof typeof s] ?? instance.status],
    [s.progress, `${summary.answered}/${summary.total} (${summary.percent} %)`],
    [s.failedChecks, String(summary.failedChecks.length)],
    [s.created, when(instance.createdAt)],
    [s.submitted, when(instance.submittedAt)],
    [s.generated, when(new Date())],
  ];
  doc.fontSize(9);
  for (const [k, v] of meta) {
    const y = doc.y;
    doc.font('R').fillColor(COLOR.muted).text(k, left, y, { width: 110 });
    doc.font('R').fillColor(COLOR.text).text(v, left + 110, y, { width: width - 110 });
  }

  // --- sections -------------------------------------------------------------
  for (const section of checklist.sections) {
    const shown = section.fields.filter((f) => isVisible(f, state.values));
    if (!shown.some((f) => isInput(f) || files.has(f.id))) continue;

    ensureSpace(doc, 60);
    doc.moveDown(1.2);
    doc.font('B').fontSize(13).fillColor(COLOR.text)
      .text(lang === 'en' ? section.titleEn : section.titleCs, left, doc.y, { width });
    rule(doc, left, width, COLOR.text);
    doc.moveDown(0.4);

    for (const field of shown) {
      if (field.type === 'group') {
        ensureSpace(doc, 40);
        doc.moveDown(0.5);
        doc.font('B').fontSize(10.5).fillColor(COLOR.text).text(label(field, lang), left, doc.y, { width });
        doc.moveDown(0.2);
        continue;
      }
      if (field.type === 'note') {
        drawNote(doc, field, lang, left, width);
        await drawFiles(doc, files.get(field.id), s, left, width);
        continue;
      }
      if (!isInput(field)) continue;
      await drawAnswer(doc, field, loaded, files, lang, left, width);
    }
  }

  // --- footer: page numbers -------------------------------------------------
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const bottom = doc.page.height - doc.page.margins.bottom;
    // Writing inside the bottom margin would otherwise trigger a new page.
    doc.page.margins.bottom = 0;
    doc.font('R').fontSize(7.5).fillColor(COLOR.muted)
      .text(`${instance.label} · ${s.page} ${i + 1} ${s.of} ${range.count}`, left, bottom + 14, {
        width,
        align: 'right',
        lineBreak: false,
      });
    doc.page.margins.bottom = PAGE_MARGIN;
  }

  doc.end();
  return done;
}

/* ----------------------------------------------------------------- answers */

async function drawAnswer(
  doc: Doc,
  field: CompiledField,
  loaded: LoadedInstance,
  files: Map<string, LoadedFile[]>,
  lang: Lang,
  left: number,
  width: number,
) {
  const s = STRINGS[lang];
  const { state } = loaded;
  const value = state.values[field.id];
  const labelW = width * LABEL_SHARE - 8;
  const valueX = left + width * LABEL_SHARE;
  const valueW = width * (1 - LABEL_SHARE);

  // Tables and signatures take the full width under their label.
  if (field.type === 'table' || field.type === 'signature') {
    ensureSpace(doc, 50);
    doc.moveDown(0.35);
    doc.font('R').fontSize(9).fillColor(COLOR.muted).text(label(field, lang), left, doc.y, { width });
    doc.moveDown(0.2);
    if (field.type === 'table') drawTable(doc, field, value, state.values, lang, left, width);
    await drawFiles(doc, files.get(field.id), s, left, width);
    doc.moveDown(0.2);
    rule(doc, left, width, COLOR.rule);
    return;
  }

  const failed = isFailed(field, value);
  const text = formatValue(field, value, lang);
  doc.fontSize(9);
  const h = Math.max(
    doc.font('R').heightOfString(label(field, lang), { width: labelW }),
    doc.font(failed || field.options ? 'B' : 'R').heightOfString(text, { width: valueW }),
  );
  ensureSpace(doc, h + 10);
  doc.moveDown(0.35);
  const y = doc.y;
  doc.font('R').fillColor(COLOR.muted).text(label(field, lang), left, y, { width: labelW });
  const afterLabel = doc.y;
  const empty = value === undefined || value === null || value === '';
  doc.font(field.options && !empty ? 'B' : 'R')
    .fillColor(empty ? COLOR.faint : value === false ? COLOR.fail : value === true ? COLOR.ok : COLOR.text)
    .text(text, valueX, y, { width: valueW });
  doc.y = Math.max(afterLabel, doc.y);

  if (failed) {
    const note = state.failNotes[field.id]?.trim();
    const body = `${s.explanation}: ${note || s.noExplanation}`;
    doc.fontSize(8.5);
    const nh = doc.heightOfString(body, { width: valueW - 10 }) + 8;
    ensureSpace(doc, nh + 4);
    doc.moveDown(0.2);
    const ny = doc.y;
    doc.save().rect(valueX, ny, valueW, nh).fill(COLOR.failBg).restore();
    doc.font('R').fillColor(COLOR.fail).text(body, valueX + 5, ny + 4, { width: valueW - 10 });
    doc.y = ny + nh;
  }

  const own = files.get(field.id);
  if (own?.length) {
    doc.moveDown(0.3);
    await drawFiles(doc, own, s, valueX, valueW);
  }
  doc.moveDown(0.25);
  rule(doc, left, width, COLOR.rule);
}

function formatValue(field: CompiledField, value: unknown, lang: Lang): string {
  if (value === undefined || value === null || value === '') return '—';
  if (field.options) {
    const opt = field.options.find((o) => o.value === value);
    if (opt) return label(opt, lang);
  }
  if (field.type === 'date' && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'cs-CZ', { dateStyle: 'long' })
      .format(new Date(Date.UTC(y, m - 1, d)));
  }
  if (field.type === 'number' && field.unit) return `${String(value)} ${field.unit}`;
  return String(value);
}

function drawNote(doc: Doc, field: CompiledField, lang: Lang, left: number, width: number) {
  const body = help(field, lang);
  doc.fontSize(9);
  const h =
    doc.font('B').heightOfString(label(field, lang), { width }) +
    (body ? doc.font('R').fontSize(8.5).heightOfString(body, { width }) : 0);
  ensureSpace(doc, h + 10);
  doc.moveDown(0.4);
  doc.font('B').fontSize(9)
    .fillColor(field.severity === 'warning' ? COLOR.fail : COLOR.text)
    .text(label(field, lang), left, doc.y, { width });
  if (body) doc.font('R').fontSize(8.5).fillColor(COLOR.muted).text(body, left, doc.y, { width });
  doc.moveDown(0.2);
}

/* ------------------------------------------------------------------ tables */

function drawTable(
  doc: Doc,
  field: CompiledField,
  value: unknown,
  values: Record<string, unknown>,
  lang: Lang,
  left: number,
  width: number,
) {
  const cols = field.columns ?? [];
  const nonEmpty = (r: Record<string, unknown>) =>
    Object.values(r).some((c) => c !== null && c !== undefined && String(c).trim() !== '');
  const stored = isTableValue(value) ? value.rows : [];
  // Fixed rows are positional: keep each row in its slot with its label, and show
  // only the rows the installer saw. Free tables drop blank rows.
  const rows = field.fixedRows
    ? visibleFixedRows(field, values).map(({ row, index }) => ({
        head: label(row, lang),
        cells: stored[index] ?? {},
      }))
    : stored.filter(nonEmpty).map((r) => ({ head: '', cells: r }));

  if (!rows.some((r) => nonEmpty(r.cells))) {
    doc.font('R').fontSize(9).fillColor(COLOR.faint).text('—', left, doc.y);
    return;
  }

  const headW = field.fixedRows ? Math.min(130, width * 0.28) : 0;
  const colW = (width - headW) / cols.length;
  const pad = 3;
  const cell = (r: Record<string, unknown>, c: (typeof cols)[number]) => {
    const v = r[c.id];
    if (v === null || v === undefined || v === '') return '';
    if (c.options) {
      const opt = c.options.find((o) => o.value === v);
      if (opt) return label(opt, lang);
    }
    return String(v);
  };

  const header = () => {
    doc.font('B').fontSize(7.5);
    const hh =
      Math.max(...cols.map((c) => doc.heightOfString(label(c, lang), { width: colW - 2 * pad }))) +
      2 * pad;
    ensureSpace(doc, hh + 16);
    const y = doc.y;
    doc.save().rect(left, y, width, hh).fill('#f1f5f9').restore();
    cols.forEach((c, i) => {
      doc.fillColor(COLOR.muted).text(label(c, lang), left + headW + i * colW + pad, y + pad, {
        width: colW - 2 * pad,
      });
    });
    doc.y = y + hh;
  };

  header();
  for (const r of rows) {
    doc.font('R').fontSize(7.5);
    const texts = cols.map((c) => cell(r.cells, c));
    const rh =
      Math.max(
        r.head ? doc.heightOfString(r.head, { width: headW - 2 * pad }) : 0,
        ...texts.map((t) => doc.heightOfString(t || ' ', { width: colW - 2 * pad })),
      ) +
      2 * pad;
    if (doc.y + rh > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      header();
    }
    const y = doc.y;
    if (r.head) doc.fillColor(COLOR.muted).text(r.head, left + pad, y + pad, { width: headW - 2 * pad });
    texts.forEach((t, i) => {
      doc.fillColor(COLOR.text).text(t, left + headW + i * colW + pad, y + pad, { width: colW - 2 * pad });
    });
    doc.y = y + rh;
    doc.save().moveTo(left, doc.y).lineTo(left + width, doc.y).lineWidth(0.5).strokeColor(COLOR.rule).stroke().restore();
  }
  doc.x = left;
}

/* ------------------------------------------------------------------- files */

interface LoadedFile {
  attachment: Attachment;
  body?: Buffer;
}

async function loadFiles(attachments: Attachment[]): Promise<Map<string, LoadedFile[]>> {
  const out = new Map<string, LoadedFile[]>();
  for (const a of attachments) {
    let body: Buffer | undefined;
    if (EMBEDDABLE.includes(a.mime)) {
      try {
        body = (await storage().get(a.storageKey)).body;
      } catch {
        body = undefined; // listed by name below instead
      }
    }
    const list = out.get(a.fieldId) ?? [];
    list.push({ attachment: a, body });
    out.set(a.fieldId, list);
  }
  return out;
}

async function drawFiles(
  doc: Doc,
  files: LoadedFile[] | undefined,
  s: (typeof STRINGS)[Lang],
  x: number,
  width: number,
) {
  if (!files?.length) return;
  const perRow = Math.max(1, Math.floor((width + 8) / (THUMB_W + 8)));
  const images = files.filter((f) => f.body);
  const others = files.filter((f) => !f.body);

  for (let i = 0; i < images.length; i += perRow) {
    ensureSpace(doc, THUMB_H + 8);
    const y = doc.y + 2;
    images.slice(i, i + perRow).forEach((f, j) => {
      const ix = x + j * (THUMB_W + 8);
      try {
        doc.image(f.body!, ix, y, { fit: [THUMB_W, THUMB_H] });
      } catch {
        doc.font('R').fontSize(8).fillColor(COLOR.muted)
          .text(`${s.attachment}: ${f.attachment.filename ?? ''}`, ix, y, { width: THUMB_W });
      }
    });
    doc.y = y + THUMB_H + 6;
  }
  for (const f of others) {
    ensureSpace(doc, 14);
    doc.font('R').fontSize(8).fillColor(COLOR.muted)
      .text(`${s.attachment}: ${f.attachment.filename ?? f.attachment.mime} (${s.notEmbedded})`, x, doc.y, { width });
  }
  doc.x = x;
}

/* ----------------------------------------------------------------- helpers */

function ensureSpace(doc: Doc, needed: number) {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom) doc.addPage();
}

function rule(doc: Doc, left: number, width: number, color: string) {
  const y = doc.y + 2;
  doc.save().moveTo(left, y).lineTo(left + width, y).lineWidth(0.5).strokeColor(color).stroke().restore();
  doc.y = y + 2;
  doc.x = left;
}

function collect(doc: Doc): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

// Say so at startup, not only on the first export, if the fonts didn't make it into the bundle.
for (const f of [REGULAR, BOLD]) {
  if (!fs.existsSync(path.join(FONT_DIR, f)))
    console.warn(`[pdf] font missing: ${path.join(FONT_DIR, f)} — PDF export will fail`);
}
