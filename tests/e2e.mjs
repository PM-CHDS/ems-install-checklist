/**
 * End-to-end walkthrough of the installer form in a real browser:
 * fill fields, verify autosave survives a reload, drive a blocking check,
 * confirm a conditional field appears, and check the admin sign-in.
 */
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const stamp = process.env.E2E_LABEL ?? `E2E ${Date.now()}`;
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

check('form renders', await page.getByText('Checklist instalace RTU / EMS').isVisible());
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
  await page.getByText('Osazení a silové připojení EMS/DŘ rozvaděče').isVisible(),
);

// answer the first blocking check with NE
const firstCard = page.locator('#field-em_dr_switchboard_installed');
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

// --- admin sign-in -----------------------------------------------------------
const admin = await browser.newPage();
await admin.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
await admin.getByLabel('Heslo').fill('wrong-password');
await admin.getByRole('button', { name: 'Přihlásit se' }).click();
await admin.waitForTimeout(1200);
check('wrong password rejected', await admin.getByText('Nesprávné heslo').isVisible());

await admin.getByLabel('Heslo').fill('devpassword');
await admin.getByRole('button', { name: 'Přihlásit se' }).click();
await admin.waitForURL('**/admin', { timeout: 10000 });
await admin.waitForTimeout(800);
check('admin signs in', await admin.getByText('Formuláře').first().isVisible());
const row = admin.locator(`a[href="/admin/${instanceId}"]`);
check('new instance listed', (await row.count()) === 1);

// open the detail page for our instance
await row.click();
await admin.waitForTimeout(1000);
check('detail shows saved answer', await admin.getByText('FVE Kolín E2E').first().isVisible());
// The check was flipped back to ANO, so it must no longer be listed as failed —
// but the audit trail must still carry the note that was written at the time.
check(
  'no longer listed under failed checks',
  (await admin.getByRole('heading', { name: /Neproběhlé kroky/ }).count()) === 0,
);
check(
  'audit trail preserves the earlier explanation',
  (await admin.getByText('Rozvaděč zatím nedorazil').count()) > 0,
);
check('detail shows audit trail', await admin.getByText('Historie změn').isVisible());

await browser.close();

console.log(`\n${fails.length ? `FAILED (${fails.length}): ${fails.join(', ')}` : 'ALL CHECKS PASSED'}`);
process.exit(fails.length ? 1 : 0);
