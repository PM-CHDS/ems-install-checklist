/**
 * Compiles every checklist under `checklists/` into `generated/<slug>.v<n>.json`
 * and copies its assets into `public/checklists/<slug>/assets/`.
 *
 * Run by `npm run compile-schema` (and as part of `npm run build`). Exits non-zero
 * on any schema error, so a bad form edit fails CI instead of reaching production.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileChecklist, discoverChecklists, SchemaError } from '../src/lib/checklist/compile';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'checklists');
const OUT = path.join(ROOT, 'generated');
const PUBLIC = path.join(ROOT, 'public', 'checklists');

function copyDir(from: string, to: string) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function main() {
  const dirs = discoverChecklists(SRC);
  if (!dirs.length) {
    console.error(`No checklists found in ${SRC}`);
    process.exit(1);
  }
  // Clear previous output: a version bump would otherwise leave the old JSON here,
  // and the startup bootstrap publishes everything it finds.
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  let fields = 0;
  for (const dir of dirs) {
    const { checklist, assetDir } = compileChecklist(dir);
    const out = path.join(OUT, `${checklist.slug}.v${checklist.version}.json`);
    fs.writeFileSync(out, JSON.stringify(checklist, null, 2) + '\n');
    copyDir(assetDir, path.join(PUBLIC, checklist.slug, 'assets'));

    const n = checklist.sections.reduce((a, s) => a + s.fields.length, 0);
    const inputs = checklist.sections
      .flatMap((s) => s.fields)
      .filter((f) => f.type !== 'note' && f.type !== 'group').length;
    const blocking = checklist.sections
      .flatMap((s) => s.fields)
      .filter((f) => f.blocking).length;
    fields += n;
    console.log(
      `✓ ${checklist.slug} v${checklist.version}: ${checklist.sections.length} sections, ` +
        `${n} fields (${inputs} inputs, ${blocking} blocking checks) → ${path.relative(ROOT, out)}`,
    );
  }
  console.log(`Compiled ${dirs.length} checklist(s), ${fields} fields total.`);
}

try {
  main();
} catch (e) {
  if (e instanceof SchemaError) {
    console.error(`\n✗ Schema error — ${e.message}\n`);
    process.exit(1);
  }
  throw e;
}
