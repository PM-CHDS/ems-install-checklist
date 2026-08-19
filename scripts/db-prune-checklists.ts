/**
 * Removes published checklist definitions that no longer exist in `generated/`.
 *
 * Deliberately not part of the startup bootstrap: dropping a definition is a
 * decision, not a side effect. Existing forms are unaffected either way — each
 * one carries its own snapshot of the definition it was created with.
 *
 *   npx tsx scripts/db-prune-checklists.ts          # show what would go
 *   npx tsx scripts/db-prune-checklists.ts --apply  # delete it
 */
import './_env';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apply = process.argv.includes('--apply');

const { and, eq } = await import('drizzle-orm');
const { db } = await import('../src/db');
const { checklists, formInstances } = await import('../src/db/schema');

const current = new Set(
  fs
    .readdirSync(path.join(ROOT, 'generated'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const d = JSON.parse(
        fs.readFileSync(path.join(ROOT, 'generated', f), 'utf8'),
      ) as { slug: string; version: number };
      return `${d.slug}@${d.version}`;
    }),
);

const published = await db.select().from(checklists);
const instances = await db.select().from(formInstances);
const stale = published.filter((c) => !current.has(`${c.slug}@${c.version}`));

if (!stale.length) {
  console.log('Nothing to prune — every published definition is current.');
  process.exit(0);
}

for (const c of stale) {
  const users = instances.filter(
    (i) => i.checklistSlug === c.slug && i.checklistVersion === c.version,
  );
  console.log(
    `${apply ? 'removing' : 'would remove'}  ${c.slug} v${c.version}  "${c.titleCs}"` +
      (users.length
        ? `  — ${users.length} existing form(s) stay on their own snapshot`
        : ''),
  );
  if (apply)
    await db
      .delete(checklists)
      .where(and(eq(checklists.slug, c.slug), eq(checklists.version, c.version)));
}
if (!apply) console.log('\nRe-run with --apply to delete.');
process.exit(0);
