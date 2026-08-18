/**
 * Publishes every checklist in `checklists/` into the database so the admin can
 * create form instances from it. Git stays the source of truth; this is a cache.
 *
 * Re-running is safe: an existing (slug, version) row is updated in place. Bump
 * `version` in checklist.yaml when a change should not affect forms already created.
 */
import './_env';
import { compileChecklist, discoverChecklists } from '../src/lib/checklist/compile';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  const { db } = await import('../src/db');
  const { checklists } = await import('../src/db/schema');

  const dirs = discoverChecklists(path.join(ROOT, 'checklists'));
  if (!dirs.length) throw new Error('no checklists found');

  for (const dir of dirs) {
    const { checklist } = compileChecklist(dir);
    await db
      .insert(checklists)
      .values({
        slug: checklist.slug,
        version: checklist.version,
        titleCs: checklist.titleCs,
        titleEn: checklist.titleEn,
        definition: checklist,
      })
      .onConflictDoUpdate({
        target: [checklists.slug, checklists.version],
        set: {
          titleCs: checklist.titleCs,
          titleEn: checklist.titleEn,
          definition: checklist,
          publishedAt: new Date(),
        },
      });
    console.log(`published ${checklist.slug} v${checklist.version}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
