/** Dev helper: create a form instance from the CLI and print its link. */
import './_env';

const label = process.argv[2] ?? 'Testovací instalace';
const slug = process.argv[3] ?? 'rtu-ems';

const { createInstance } = await import('../src/lib/instances');
const instance = await createInstance({ checklistSlug: slug, label, lang: 'cs' });
const base = process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000';
console.log(`id=${instance.id}`);
console.log(`token=${instance.token}`);
console.log(`link=${base}/f/${instance.token}`);
process.exit(0);
