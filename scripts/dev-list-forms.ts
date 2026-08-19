/**
 * Dev helper: which checklist versions are published, and which version each
 * existing form is pinned to. Useful after a version bump, to see what an old
 * link will still show.
 */
import './_env';

const { desc } = await import('drizzle-orm');
const { db } = await import('../src/db');
const { checklists, formInstances } = await import('../src/db/schema');

const published = await db.select().from(checklists).orderBy(checklists.version);
console.log('Published definitions:');
for (const c of published)
  console.log(`   v${c.version}  ${c.titleCs}`);

const rows = await db
  .select()
  .from(formInstances)
  .orderBy(desc(formInstances.createdAt));

console.log(`\nForms (${rows.length}), with the version each is pinned to:`);
for (const r of rows) {
  console.log(
    `   v${r.checklistVersion}  ${String(r.status).padEnd(12)}` +
      `${r.label.slice(0, 30).padEnd(32)}${r.definition.titleCs}`,
  );
}
process.exit(0);
