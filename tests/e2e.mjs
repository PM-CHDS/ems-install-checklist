/**
 * End-to-end walkthrough of the installer form in a real browser:
 * fill fields, verify autosave survives a reload, drive a blocking check,
 * confirm a conditional field appears, and check the admin sign-in.
 */
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';

/** Smallest valid PNG, used as stand-in photo evidence. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9QzzCKRsEoGgWjAAB2gwSFLo0ZBwAAAABJRU5ErkJggg==',
  'base64',
);

const BASE = process.env.BASE ?? 'http://localhost:3000';
const stamp = process.env.E2E_LABEL ?? `E2E ${Date.now()}`;
/** Must match the server under test; the deployment's password is not the dev default. */
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'devpassword';
const out = execFileSync('npx', ['tsx', 'scripts/dev-create-instance.ts', stamp], {
  encoding: 'utf8',
});
const token = out.match(/token=(\S+)/)[1];
const instanceId = out.match(/id=(\S+)/)[1];
const runLabel = `E2E ${instanceId.slice(0, 8)}`;
console.log(`instance token: ${token}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
const fails = [];
const check = (name, ok, extra = '') => {
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${extra ? ' — ' + extra : ''}`);
  if (!ok) fails.push(name);
};

page.on('pageerror', (e) => fails.push(`page error: ${e.message}`));

await page.goto(`${BASE}/f/${token}`, { waitUntil: 'networkidle' });

check('form renders', await page.getByText('Checklist instalace EMS').isVisible());
check('instance label shown', await page.getByText(stamp).isVisible());

// --- typing into the cover section, then reload to prove autosave -------------
await page.getByLabel('Název projektu').fill('FVE Kolín E2E');
await page.getByLabel('Adresa instalace').fill('Kolín, Průmyslová 12');
await page.waitForFunction(
  () => document.body.innerText.includes('Uloženo'),
  { timeout: 8000 },
);
check('save indicator reaches "Uloženo"', true);

await page.reload({ waitUntil: 'networkidle' });
check(
  'values survive a reload',
  (await page.getByLabel('Název projektu').inputValue()) === 'FVE Kolín E2E',
);

// --- language toggle ---------------------------------------------------------
await page.getByRole('button', { name: 'en', exact: true }).click();
check('EN toggle switches labels', await page.getByText('Project name').isVisible());
await page.getByRole('button', { name: 'cs', exact: true }).click();

// --- section 1 (nav button "2": the cover is "1") ----------------------------
await page.getByRole('button', { name: '2', exact: true }).click();
await page.waitForTimeout(400);
check(
  'section 1 renders its checks',
  await page.getByText('Osazení a silové připojení EMS rozvaděče').isVisible(),
);

// answer the first blocking check with NE
const firstCard = page.locator('#field-ems_switchboard_installed');
await firstCard.getByRole('button', { name: 'NE', exact: true }).click();
await page.waitForTimeout(400);
check(
  'answering NE opens the explanation box',
  await firstCard.getByText('Tento krok neproběhl').isVisible(),
);
await firstCard.locator('textarea').fill('Rozvaděč zatím nedorazil na stavbu.');
await page.waitForFunction(() => document.body.innerText.includes('Uloženo'), { timeout: 8000 });
check(
  'form flagged as having issues',
  await page.getByText('Formulář je označen jako').isVisible(),
);

// switching back to ANO closes it again
await firstCard.getByRole('button', { name: 'ANO', exact: true }).click();
await page.waitForTimeout(300);
check(
  'answering ANO closes the explanation box',
  !(await firstCard.getByText('Tento krok neproběhl').isVisible()),
);

// --- numeric gating: a count of 0 hides the follow-up checks -----------------
const count = page.locator('#field-mar_switchboard_count input');
check(
  'gated check hidden while the count is unanswered',
  (await page.locator('#field-mar_switchboard_installed').count()) === 0,
);
await count.fill('0');
await page.waitForTimeout(1000);
check(
  'gated check stays hidden at 0',
  (await page.locator('#field-mar_switchboard_installed').count()) === 0,
);
await count.fill('2');
await page.waitForTimeout(1000);
check(
  'gated check appears above 0',
  (await page.locator('#field-mar_switchboard_installed').count()) === 1,
);

// --- conditional visibility --------------------------------------------------
await page.getByRole('button', { name: '5', exact: true }).click();
await page.waitForTimeout(400);
const meteoIp = page.locator('#field-meteo_station_ip');
check('conditional field hidden before its gate', (await meteoIp.count()) === 0);
await page
  .locator('#field-meteo_station_installed')
  .getByRole('button', { name: 'ANO', exact: true })
  .click();
await page.waitForTimeout(400);
check('conditional field appears after answering its gate', (await meteoIp.count()) === 1);

// --- repeatable table --------------------------------------------------------
await page.getByRole('button', { name: '3', exact: true }).click();
await page.waitForTimeout(400);
const table = page.locator('#field-additional_meters_table');
const before = await table.locator('tbody tr').count();
await table.getByRole('button', { name: /Přidat řádek/ }).click();
await page.waitForTimeout(200);
check('table rows can be added', (await table.locator('tbody tr').count()) === before + 1);

// --- review step -------------------------------------------------------------
await page.getByRole('button', { name: /Kontrola a odeslání/ }).first().click();
await page.waitForTimeout(600);
check(
  'review lists missing required items',
  await page.getByRole('heading', { name: /Chybějící povinné položky \(\d+\)/ }).isVisible(),
);
const submitBtn = page.getByRole('button', { name: 'Odeslat checklist' });
check('submit is disabled while incomplete', await submitBtn.isDisabled());

// --- signature + full submit, entirely through the UI ------------------------
// Fills every remaining required field via the API, then signs in the browser and
// submits — this is the path where a saved signature has to satisfy its own
// required-field check without a page reload.
execFileSync('npx', ['tsx', 'scripts/dev-fill.ts', token], { encoding: 'utf8' });
for (const field of [
  'cloud_connectivity_note',
  'photos_control_unit_displays',
  'photos_technology_nameplates',
  'distribution_portal_screenshot',
]) {
  const body = new FormData();
  body.append('file', new Blob([PNG], { type: 'image/png' }), 'evidence.png');
  body.append('fieldId', field);
  body.append('kind', 'photo');
  const r = await fetch(`${BASE}/api/f/${token}/attachments`, { method: 'POST', body });
  if (!r.ok) throw new Error(`photo upload for ${field}: ${await r.text()}`);
}

await page.reload({ waitUntil: 'networkidle' });
await page.getByRole('button', { name: '7', exact: true }).click();
await page.waitForTimeout(500);

const pad = page.locator('#field-signature canvas');
await pad.scrollIntoViewIfNeeded();
const box = await pad.boundingBox();
await page.mouse.move(box.x + 20, box.y + 60);
await page.mouse.down();
await page.mouse.move(box.x + 90, box.y + 20, { steps: 8 });
await page.mouse.move(box.x + 160, box.y + 80, { steps: 8 });
await page.mouse.up();
await page.locator('#field-signature').getByRole('button', { name: 'Uložit podpis' }).click();
await page.waitForTimeout(1500);
check(
  'drawn signature is saved',
  await page.locator('#field-signature').getByText('Podpis uložen').isVisible(),
);

await page.getByRole('button', { name: /Kontrola a odeslání/ }).first().click();
await page.waitForTimeout(1000);
const finalSubmit = page.getByRole('button', { name: 'Odeslat checklist' });
check('submit enabled once everything is filled', await finalSubmit.isEnabled());
await finalSubmit.click();
await page.waitForTimeout(2500);
check(
  'submitting locks the form',
  await page.getByText('Checklist byl odeslán').isVisible(),
);

// --- admin sign-in -----------------------------------------------------------
// The admin panel is English by default; the form itself stays in the language the
// instance was created with.
const admin = await browser.newPage();
await admin.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
await admin.getByLabel('Password').fill('wrong-password');
await admin.getByRole('button', { name: 'Sign in' }).click();
await admin.waitForTimeout(1200);
check('wrong password rejected', await admin.getByText('Incorrect password').isVisible());

await admin.getByLabel('Password').fill(ADMIN_PASSWORD);
await admin.getByRole('button', { name: 'Sign in' }).click();
await admin.waitForURL('**/admin', { timeout: 10000 });
await admin.waitForTimeout(800);
check('admin signs in', await admin.getByText('Forms').first().isVisible());
check(
  'admin defaults to English',
  await admin.getByRole('button', { name: 'Sign out' }).isVisible(),
);
await admin.getByRole('button', { name: 'cs', exact: true }).click();
await admin.waitForTimeout(1500);
check('admin can switch to Czech', await admin.getByText('Administrace checklistů').isVisible());
await admin.getByRole('button', { name: 'en', exact: true }).click();
await admin.waitForTimeout(1500);
check(
  'admin switches back to English',
  await admin.getByText('Checklist administration').isVisible(),
);

const row = admin.locator(`a[href="/admin/${instanceId}"]`);
check('new instance listed', (await row.count()) === 1);

// open the detail page for our instance
await row.click();
await admin.waitForTimeout(1000);
check('detail shows saved answer', await admin.getByText('FVE Kolín E2E').first().isVisible());
check(
  'detail shows the submitted status',
  await admin.getByText('Submitted').first().isVisible(),
);
// The check was flipped back to ANO, so it must no longer be listed as failed —
// but the audit trail must still carry the note that was written at the time.
check(
  'no longer listed under failed checks',
  (await admin.getByRole('heading', { name: /Steps that did/ }).count()) === 0,
);
check(
  'audit trail preserves the earlier explanation',
  (await admin.getByText('Rozvaděč zatím nedorazil').count()) > 0,
);
check('detail shows audit trail', await admin.getByText(/Change history/).isVisible());

await browser.close();

console.log(`\n${fails.length ? `FAILED (${fails.length}): ${fails.join(', ')}` : 'ALL CHECKS PASSED'}`);
process.exit(fails.length ? 1 : 0);
