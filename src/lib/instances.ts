import { randomBytes } from 'node:crypto';
import { and, desc, eq, inArray, notInArray } from 'drizzle-orm';
import { db } from '@/db';
import {
  answers,
  attachments,
  checklists,
  events,
  formInstances,
  type Attachment,
  type FormInstance,
  type FormStatus,
} from '@/db/schema';
import type { CompiledChecklist, Lang } from '@/lib/checklist/types';
import {
  derivedStatus,
  emptyState,
  isFailed,
  summarize,
  type FormState,
  type FormSummary,
} from '@/lib/checklist/state';
import { fieldById } from '@/lib/checklist/types';

/** URL-safe, ~26 chars of entropy. Long enough that links can't be guessed. */
export function newToken(): string {
  return randomBytes(20).toString('base64url');
}

export interface LoadedInstance {
  instance: FormInstance;
  checklist: CompiledChecklist;
  state: FormState;
  attachments: Attachment[];
}

function buildState(
  rows: { fieldId: string; value: unknown; failNote: string | null }[],
  files: Attachment[],
): FormState {
  const state = emptyState();
  for (const r of rows) {
    state.values[r.fieldId] = r.value;
    if (r.failNote != null) state.failNotes[r.fieldId] = r.failNote;
  }
  for (const f of files) {
    if (f.kind === 'signature') continue;
    state.photoCounts[f.fieldId] = (state.photoCounts[f.fieldId] ?? 0) + 1;
  }
  return state;
}

export async function loadByToken(token: string): Promise<LoadedInstance | null> {
  const [instance] = await db
    .select()
    .from(formInstances)
    .where(eq(formInstances.token, token))
    .limit(1);
  if (!instance) return null;
  return hydrate(instance);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Postgres rejects a non-UUID literal outright, so screen it here and 404. */
export function isUuid(v: string): boolean {
  return UUID_RE.test(v);
}

export async function loadById(id: string): Promise<LoadedInstance | null> {
  if (!isUuid(id)) return null;
  const [instance] = await db
    .select()
    .from(formInstances)
    .where(eq(formInstances.id, id))
    .limit(1);
  if (!instance) return null;
  return hydrate(instance);
}

async function hydrate(instance: FormInstance): Promise<LoadedInstance> {
  const [rows, files] = await Promise.all([
    db
      .select({
        fieldId: answers.fieldId,
        value: answers.value,
        failNote: answers.failNote,
      })
      .from(answers)
      .where(eq(answers.instanceId, instance.id)),
    db
      .select()
      .from(attachments)
      .where(eq(attachments.instanceId, instance.id))
      .orderBy(attachments.createdAt),
  ]);
  return {
    instance,
    checklist: instance.definition,
    state: buildState(rows, files),
    attachments: files,
  };
}

export const LOCKED_STATUSES: FormStatus[] = ['submitted', 'reviewed'];

export function isLocked(instance: FormInstance): boolean {
  return LOCKED_STATUSES.includes(instance.status);
}

/* ------------------------------------------------------------------- writing */

export async function recordEvent(
  instanceId: string,
  type: string,
  opts: { fieldId?: string; payload?: unknown; actor?: string } = {},
) {
  await db.insert(events).values({
    instanceId,
    type,
    fieldId: opts.fieldId,
    payload: (opts.payload ?? null) as never,
    actor: opts.actor ?? 'installer',
  });
}

export interface SaveAnswerInput {
  fieldId: string;
  value?: unknown;
  failNote?: string | null;
}

/**
 * Upsert one field's answer. Returns the recomputed instance status so the client
 * can reflect an "issues" flag immediately.
 */
export async function saveAnswer(
  loaded: LoadedInstance,
  input: SaveAnswerInput,
): Promise<{ status: FormStatus }> {
  const { instance, checklist } = loaded;
  const field = fieldById(checklist, input.fieldId);
  if (!field) throw new Error(`unknown field \`${input.fieldId}\``);

  const failed = isFailed(field, input.value);
  const failNote = failed ? (input.failNote ?? null) : null;

  await db
    .insert(answers)
    .values({
      instanceId: instance.id,
      fieldId: input.fieldId,
      value: (input.value ?? null) as never,
      failed,
      failNote,
    })
    .onConflictDoUpdate({
      target: [answers.instanceId, answers.fieldId],
      set: {
        value: (input.value ?? null) as never,
        failed,
        failNote,
        updatedAt: new Date(),
      },
    });

  await recordEvent(instance.id, 'answer.saved', {
    fieldId: input.fieldId,
    payload: { value: input.value ?? null, failed, failNote },
  });

  // Recompute status from the full answer set, not just this field.
  const next = { ...loaded.state.values, [input.fieldId]: input.value };
  const notes = { ...loaded.state.failNotes, [input.fieldId]: failNote };
  const status = derivedStatus(
    { values: next, failNotes: notes, photoCounts: loaded.state.photoCounts },
    checklist,
  );

  // Never let a late-arriving autosave downgrade a form that has since been
  // submitted — that would silently unlock it.
  await db
    .update(formInstances)
    .set({
      status,
      updatedAt: new Date(),
      lastActivityAt: new Date(),
    })
    .where(
      and(
        eq(formInstances.id, instance.id),
        notInArray(formInstances.status, LOCKED_STATUSES),
      ),
    );

  return { status };
}

export async function addAttachment(
  instanceId: string,
  data: {
    fieldId: string;
    kind: 'photo' | 'signature';
    storageKey: string;
    filename?: string;
    mime: string;
    size: number;
  },
): Promise<Attachment> {
  // A signature replaces any previous one for that field.
  if (data.kind === 'signature') {
    await db
      .delete(attachments)
      .where(
        and(
          eq(attachments.instanceId, instanceId),
          eq(attachments.fieldId, data.fieldId),
          eq(attachments.kind, 'signature'),
        ),
      );
  }
  const [row] = await db
    .insert(attachments)
    .values({ instanceId, ...data })
    .returning();

  // A signature field's "answer" is the signature image itself. Record it as an
  // answer too, so completeness checks, the admin table and the export all see it
  // the same way as any other field.
  if (data.kind === 'signature') {
    await db
      .insert(answers)
      .values({ instanceId, fieldId: data.fieldId, value: row.id as never })
      .onConflictDoUpdate({
        target: [answers.instanceId, answers.fieldId],
        set: { value: row.id as never, updatedAt: new Date() },
      });
  }

  await recordEvent(instanceId, 'attachment.added', {
    fieldId: data.fieldId,
    payload: { kind: data.kind, filename: data.filename, size: data.size },
  });
  await db
    .update(formInstances)
    .set({ updatedAt: new Date(), lastActivityAt: new Date() })
    .where(eq(formInstances.id, instanceId));
  return row;
}

export async function removeAttachment(
  instanceId: string,
  attachmentId: string,
): Promise<Attachment | null> {
  const [row] = await db
    .delete(attachments)
    .where(and(eq(attachments.id, attachmentId), eq(attachments.instanceId, instanceId)))
    .returning();
  if (row) {
    if (row.kind === 'signature') {
      await db
        .delete(answers)
        .where(and(eq(answers.instanceId, instanceId), eq(answers.fieldId, row.fieldId)));
    }
    await recordEvent(instanceId, 'attachment.removed', {
      fieldId: row.fieldId,
      payload: { filename: row.filename },
    });
  }
  return row ?? null;
}

export async function setStatus(
  instanceId: string,
  status: FormStatus,
  actor = 'installer',
) {
  const now = new Date();
  await db
    .update(formInstances)
    .set({
      status,
      updatedAt: now,
      ...(status === 'submitted' ? { submittedAt: now } : {}),
      ...(status === 'reviewed' ? { reviewedAt: now } : {}),
    })
    .where(eq(formInstances.id, instanceId));
  await recordEvent(instanceId, 'status.changed', { payload: { status }, actor });
}

/* ------------------------------------------------------------------- reading */

export interface InstanceListRow {
  instance: FormInstance;
  summary: FormSummary;
  failed: number;
  attachmentCount: number;
}

/**
 * The admin list with a real completion figure per form. One query for all answers
 * and one for all attachments, then the same `summarize()` the form itself uses —
 * so the percentage on this screen means exactly what the installer sees.
 */
export async function listInstances(): Promise<InstanceListRow[]> {
  const rows = await db
    .select()
    .from(formInstances)
    .orderBy(desc(formInstances.createdAt));
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);

  const [allAnswers, allFiles] = await Promise.all([
    db
      .select({
        instanceId: answers.instanceId,
        fieldId: answers.fieldId,
        value: answers.value,
        failed: answers.failed,
        failNote: answers.failNote,
      })
      .from(answers)
      .where(inArray(answers.instanceId, ids)),
    db
      .select()
      .from(attachments)
      .where(inArray(attachments.instanceId, ids)),
  ]);

  const answersByInstance = new Map<string, typeof allAnswers>();
  for (const a of allAnswers) {
    const list = answersByInstance.get(a.instanceId) ?? [];
    list.push(a);
    answersByInstance.set(a.instanceId, list);
  }
  const filesByInstance = new Map<string, Attachment[]>();
  for (const f of allFiles) {
    const list = filesByInstance.get(f.instanceId) ?? [];
    list.push(f);
    filesByInstance.set(f.instanceId, list);
  }

  return rows.map((instance) => {
    const rowAnswers = answersByInstance.get(instance.id) ?? [];
    const files = filesByInstance.get(instance.id) ?? [];
    const state = buildState(rowAnswers, files);
    return {
      instance,
      summary: summarize(instance.definition, state),
      failed: rowAnswers.filter((a) => a.failed).length,
      attachmentCount: files.length,
    };
  });
}

export async function listEvents(instanceId: string, limit = 500) {
  return db
    .select()
    .from(events)
    .where(eq(events.instanceId, instanceId))
    .orderBy(desc(events.createdAt))
    .limit(limit);
}

export async function listPublishedChecklists() {
  return db.select().from(checklists).orderBy(checklists.slug, desc(checklists.version));
}

export interface CreateInstanceInput {
  checklistSlug: string;
  checklistVersion?: number;
  label: string;
  customerName?: string;
  customerEmail?: string;
  lang: Lang;
  prefill?: Record<string, unknown>;
  note?: string;
}

export async function createInstance(input: CreateInstanceInput): Promise<FormInstance> {
  const available = await db
    .select()
    .from(checklists)
    .where(eq(checklists.slug, input.checklistSlug))
    .orderBy(desc(checklists.version));
  const row = input.checklistVersion
    ? available.find((c) => c.version === input.checklistVersion)
    : available[0];
  if (!row)
    throw new Error(
      `checklist \`${input.checklistSlug}\` is not published — run \`npm run db:sync-schema\``,
    );

  const [instance] = await db
    .insert(formInstances)
    .values({
      token: newToken(),
      checklistSlug: row.slug,
      checklistVersion: row.version,
      // Snapshot: editing the schema in git must not change a form already in the field.
      definition: row.definition,
      label: input.label,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      lang: input.lang,
      prefill: input.prefill,
      note: input.note,
    })
    .returning();

  if (input.prefill && Object.keys(input.prefill).length) {
    await db.insert(answers).values(
      Object.entries(input.prefill).map(([fieldId, value]) => ({
        instanceId: instance.id,
        fieldId,
        value: value as never,
      })),
    );
  }

  await recordEvent(instance.id, 'instance.created', {
    payload: { checklist: row.slug, version: row.version, label: input.label },
    actor: 'admin',
  });
  return instance;
}

export async function deleteInstance(instanceId: string) {
  await db.delete(formInstances).where(eq(formInstances.id, instanceId));
}
