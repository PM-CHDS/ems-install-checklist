/**
 * Startup bootstrap: apply pending migrations, then publish the compiled checklists
 * into the database.
 *
 * Doing this in-process means a container starts up ready to use — no separate
 * "remember to run db:migrate" step that a deployment can silently skip. Both halves
 * are idempotent, so re-running on every boot is harmless. Set AUTO_BOOTSTRAP=false
 * to manage migrations yourself (e.g. when running several replicas).
 */
import fs from 'node:fs';
import path from 'node:path';
import type { CompiledChecklist } from '@/lib/checklist/types';

let done: Promise<void> | null = null;

export function bootstrap(): Promise<void> {
  done ??= run();
  return done;
}

async function run() {
  const started = Date.now();
  await migrate();
  const n = await publishChecklists();
  console.log(
    `[bootstrap] database ready, ${n} checklist(s) published (${Date.now() - started}ms)`,
  );
}

async function migrate() {
  const dir = path.join(process.cwd(), 'drizzle');
  if (!fs.existsSync(dir)) {
    console.warn(`[bootstrap] no migrations directory at ${dir}, skipping`);
    return;
  }
  const [{ drizzle }, { migrate: runMigrations }, { default: postgres }] =
    await Promise.all([
      import('drizzle-orm/postgres-js'),
      import('drizzle-orm/postgres-js/migrator'),
      import('postgres'),
    ]);
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  // A dedicated single connection: the migration lock shouldn't hold a pool slot.
  const client = postgres(url, { max: 1 });
  try {
    await runMigrations(drizzle(client), { migrationsFolder: dir });
  } finally {
    await client.end();
  }
}

/**
 * Reads the compiled definitions emitted by `npm run compile-schema`. Reading the
 * build output rather than re-compiling the markdown keeps the YAML parser and the
 * checklist sources out of the runtime image.
 */
export async function publishChecklists(): Promise<number> {
  const dir = path.join(process.cwd(), 'generated');
  if (!fs.existsSync(dir)) {
    console.warn(`[bootstrap] no compiled checklists at ${dir}, skipping`);
    return 0;
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  if (!files.length) return 0;

  const { db } = await import('@/db');
  const { checklists } = await import('@/db/schema');

  for (const file of files) {
    const definition = JSON.parse(
      fs.readFileSync(path.join(dir, file), 'utf8'),
    ) as CompiledChecklist;
    await db
      .insert(checklists)
      .values({
        slug: definition.slug,
        version: definition.version,
        titleCs: definition.titleCs,
        titleEn: definition.titleEn,
        definition,
      })
      .onConflictDoUpdate({
        target: [checklists.slug, checklists.version],
        set: {
          titleCs: definition.titleCs,
          titleEn: definition.titleEn,
          definition,
          publishedAt: new Date(),
        },
      });
  }
  return files.length;
}
