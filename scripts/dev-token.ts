/** Dev helper: print the link for an existing form, found by label substring. */
import './_env';
const { formInstances } = await import('../src/db/schema');
const { db } = await import('../src/db');
const rows = await db.select().from(formInstances);
const needle = (process.argv[2] ?? '').toLowerCase();
for (const r of rows.filter((r) => r.label.toLowerCase().includes(needle)))
  console.log(`v${r.checklistVersion}\t${r.label}\t${r.token}`);
process.exit(0);
