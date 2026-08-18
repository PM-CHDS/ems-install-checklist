/** Dev helper: fills every visible required field of an instance with plausible
 *  data and attempts a submit. Used to exercise the whole validation path. */
import './_env';

const token = process.argv[2];
if (!token) throw new Error('usage: dev-fill <token>');
const base = process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000';

const { loadByToken } = await import('../src/lib/instances');
const { isVisible, hasValue, isFailed } = await import('../src/lib/checklist/state');
const { isInput } = await import('../src/lib/checklist/types');

const loaded = await loadByToken(token);
if (!loaded) throw new Error('no such token');

// Several passes: filling a gate field reveals conditional fields behind it.
for (let pass = 0; pass < 4; pass++) {
  const current = await loadByToken(token);
  if (!current) break;
  const values = current.state.values;
  const updates: { fieldId: string; value: unknown; failNote?: string }[] = [];

  for (const section of current.checklist.sections) {
    for (const f of section.fields) {
      if (!isInput(f) || !isVisible(f, values)) continue;
      if (isFailed(f, values[f.id])) {
        if (!current.state.failNotes[f.id])
          updates.push({ fieldId: f.id, value: false, failNote: 'Automatické testovací vysvětlení.' });
        continue;
      }
      if (hasValue(f, values[f.id])) continue;
      if (!f.required) continue;

      let value: unknown;
      switch (f.type) {
        case 'boolean': value = true; break;
        case 'number': value = 42; break;
        case 'date': value = '2026-08-18'; break;
        case 'select': value = f.options?.[0]?.value ?? null; break;
        case 'signature': continue; // needs a real upload
        case 'table':
          value = { rows: [Object.fromEntries((f.columns ?? []).map((c) => [c.id, c.type === 'number' ? 1 : 'X']))] };
          break;
        default: value = 'testovací hodnota';
      }
      updates.push({ fieldId: f.id, value });
    }
  }
  if (!updates.length) break;
  const res = await fetch(`${base}/api/f/${token}/answers`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ updates }),
  });
  console.log(`pass ${pass + 1}: ${updates.length} fields -> ${res.status}`);
}

const submit = await fetch(`${base}/api/f/${token}/submit`, { method: 'POST' });
console.log(`submit -> ${submit.status}: ${(await submit.text()).slice(0, 500)}`);
process.exit(0);
