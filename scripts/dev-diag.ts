import './_env';
const { sql } = await import('drizzle-orm');
const { db } = await import('../src/db');
const q = async (label: string, text: string) => {
  const r = await db.execute(sql.raw(text));
  console.log(label, JSON.stringify(r));
};
await q('row counts:', `select
  (select count(*) from form_instances) as instances,
  (select count(*) from answers) as answers,
  (select count(*) from attachments) as attachments,
  (select count(*) from events) as events`);
await q('oldest/newest instance:', `select min(created_at) as oldest, max(created_at) as newest from form_instances`);
await q('oldest/newest event:', `select min(created_at) as oldest, max(created_at) as newest from events`);
await q('checklists published_at:', `select version, published_at from checklists order by version`);
process.exit(0);
