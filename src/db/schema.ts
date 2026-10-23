import {
  doublePrecision,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { CompiledChecklist, Lang } from '@/lib/checklist/types';

/**
 * Published checklist definitions, kept in sync from `checklists/` in git by
 * `npm run db:sync-schema`. Git is the source of truth; this table is a cache so
 * the admin can create instances without reading the filesystem.
 */
export const checklists = pgTable(
  'checklists',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull(),
    // Decimal so a checklist can carry a minor version (8.1); compared numerically.
    version: doublePrecision('version').notNull(),
    titleCs: text('title_cs').notNull(),
    titleEn: text('title_en').notNull(),
    definition: jsonb('definition').$type<CompiledChecklist>().notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex('checklists_slug_version_idx').on(t.slug, t.version)],
);

export type FormStatus =
  | 'created'
  | 'in_progress'
  | 'issues'
  | 'submitted'
  | 'reviewed';

/**
 * One filled-out checklist. `token` is the secret in the customer link; `definition`
 * is a snapshot of the checklist as it was when the link was created, so editing the
 * schema in git never changes a form already in the field.
 */
export const formInstances = pgTable(
  'form_instances',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    token: text('token').notNull(),
    checklistSlug: text('checklist_slug').notNull(),
    checklistVersion: doublePrecision('checklist_version').notNull(),
    definition: jsonb('definition').$type<CompiledChecklist>().notNull(),
    /** Human label for the admin list, e.g. project / site name. */
    label: text('label').notNull(),
    customerName: text('customer_name'),
    customerEmail: text('customer_email'),
    lang: text('lang').$type<Lang>().notNull().default('cs'),
    status: text('status').$type<FormStatus>().notNull().default('created'),
    /** Field values pre-filled by the admin when creating the link. */
    prefill: jsonb('prefill').$type<Record<string, unknown>>(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('form_instances_token_idx').on(t.token),
    index('form_instances_status_idx').on(t.status),
  ],
);

/**
 * One row per answered field. Upserted on (instance_id, field_id) by the autosave
 * endpoint. `value` holds the scalar for simple fields, or `{rows: [...]}` for tables.
 */
export const answers = pgTable(
  'answers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instanceId: uuid('instance_id')
      .notNull()
      .references(() => formInstances.id, { onDelete: 'cascade' }),
    fieldId: text('field_id').notNull(),
    value: jsonb('value'),
    /** true when this is a blocking check answered with the failing option. */
    failed: boolean('failed').notNull().default(false),
    failNote: text('fail_note'),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex('answers_instance_field_idx').on(t.instanceId, t.fieldId),
    index('answers_instance_idx').on(t.instanceId),
  ],
);

export const attachments = pgTable(
  'attachments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instanceId: uuid('instance_id')
      .notNull()
      .references(() => formInstances.id, { onDelete: 'cascade' }),
    fieldId: text('field_id').notNull(),
    kind: text('kind').$type<'photo' | 'signature'>().notNull().default('photo'),
    storageKey: text('storage_key').notNull(),
    filename: text('filename'),
    mime: text('mime').notNull(),
    size: integer('size').notNull(),
    width: integer('width'),
    height: integer('height'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index('attachments_instance_field_idx').on(t.instanceId, t.fieldId)],
);

/**
 * Append-only audit trail: every save, upload, status change. Gives the admin the
 * exact sequence of inserts per field.
 */
export const events = pgTable(
  'events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instanceId: uuid('instance_id')
      .notNull()
      .references(() => formInstances.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    fieldId: text('field_id'),
    payload: jsonb('payload'),
    actor: text('actor').notNull().default('installer'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index('events_instance_idx').on(t.instanceId, t.createdAt)],
);

export type FormInstance = typeof formInstances.$inferSelect;
export type Answer = typeof answers.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type Event = typeof events.$inferSelect;
export type ChecklistRow = typeof checklists.$inferSelect;
