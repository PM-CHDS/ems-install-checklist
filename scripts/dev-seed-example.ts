/**
 * Dev helper: creates one completely filled rtu-ems form as a realistic example —
 * every visible field (optional ones too), a photo on every photo-capable field,
 * a drawn signature — and submits it.
 *
 *   npx tsx scripts/dev-seed-example.ts ["Label"] [--lang en] [--no-submit]
 *
 * Goes through the public API like the browser does, so the app must be running
 * (PUBLIC_BASE_URL). Placeholder photos and the signature are rendered with
 * Playwright's Chromium; fields with a matching help illustration get that instead.
 * The scenario opens as many conditional branches as the form allows within one
 * site: PV controlled via a Logger (so the Modbus RTU/TCP branches stay hidden),
 * SPOT for both sale and purchase (so the FIX blocks stay hidden), an indoor
 * switchboard (no heating check).
 */
import './_env';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const noSubmit = args.includes('--no-submit');
const langArg = args.indexOf('--lang');
const lang: 'cs' | 'en' = langArg >= 0 && args[langArg + 1] === 'en' ? 'en' : 'cs';
const t = (cs: string, en: string) => (lang === 'en' ? en : cs);
const label =
  args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--lang') ??
  t('UKÁZKA – kompletně vyplněný checklist', 'EXAMPLE – fully filled checklist');
const base = process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = path.join(root, 'checklists/rtu-ems/assets');

const { createInstance, loadByToken } = await import('../src/lib/instances');
const { isVisible, hasValue, summarize, visibleFixedRows } = await import('../src/lib/checklist/state');
const { isInput } = await import('../src/lib/checklist/types');

const PROJECT = t('FVE 498 kWp + BESS 430 kWh – Logistický areál Modřice', 'PV 498 kWp + BESS 430 kWh – Modřice Logistics Park');
const DATE = new Date().toISOString().slice(0, 10);

const values: Record<string, unknown> = {
  // Cover
  project_name: PROJECT,
  installation_address: 'Brněnská 1250/17, 664 42 Modřice',
  contact_person: 'Ing. Petr Dvořák',
  contact_email: 'petr.dvorak@example.cz',
  contact_phone: '+420 731 456 289',

  // 1. Elektroinstalace
  em_dr_switchboard_installed: true,
  mar_switchboard_count: 2,
  mar_switchboard_installed: true,
  remote_metering_switchboard_count: 1,
  remote_metering_switchboard_installed: true,
  ems_full_location: 'inside',
  // Positional: EMS/DŘ, MaR1, MaR2, remote metering.
  switchboard_jps_labels: {
    rows: [{ jps_label: 'RE-EMS/DŘ' }, { jps_label: t('RMaR1 – hala A', 'RMaR1 – Hall A') }, { jps_label: t('RMaR2 – hala B', 'RMaR2 – Hall B') }, { jps_label: t('RM-OM1 – trafostanice', 'RM-OM1 – substation') }],
  },

  // 2. Elektroměry
  main_meter_purpose: 'delivery_point',
  meter_at_vn: true,
  mtp_installed: true,
  mtn_installed: true,
  current_direction_check: true,
  phase_sequence_check: true,
  voltage_current_correspondence_check: true,
  mtp_ratio_set: true,
  mtp_value: '50/5 A',
  voltage_level_measured_set: true,
  voltage_level_value: t('22 kV (sekundárně 3×100 V)', '22 kV (secondary 3×100 V)'),
  mtn_ratio_set: true,
  mtn_value: '22 000/100 V',
  additional_meters_count: 3,
  additional_meters_table: {
    rows: [
      { jps_label: 'EM-FVE1', meter_type: 'Janitza UMG 96-PA', comm_method: 'tcp', ip_or_modbus_id: '192.168.10.31, ID 1', mtp_ratio: '600/5 A', terminal_block: '' },
      { jps_label: 'EM-FVE2', meter_type: 'Carlo Gavazzi EM24-DIN AV5 3 D X', comm_method: 'rtu', ip_or_modbus_id: 'ID 12', mtp_ratio: '200/5 A', terminal_block: 'x1' },
      { jps_label: 'EM-BESS', meter_type: 'Carlo Gavazzi EM24-DIN AV5 3 D X', comm_method: 'rtu', ip_or_modbus_id: 'ID 13', mtp_ratio: '800/5 A', terminal_block: 'x2' },
    ],
  },
  meters_notes:
    t(
      'EM-FVE2 a EM-BESS na sběrnici RS-485 9600 Bd, 8N1. Převody MTP ověřeny na displeji elektroměrů i v konfiguraci PLC.',
      'EM-FVE2 and EM-BESS on the RS-485 bus at 9600 Bd, 8N1. MTP ratios verified on the meter displays and in the PLC configuration.',
    ),

  // 3. Parametrizace a komunikace
  eth_connected_ems_dr: true,
  eth_connected_mar: true,
  data_network_configured: true,
  control_units_ip_ic_table: {
    rows: [
      { ic_number: '6450212fb9e5959', ip_address: '192.168.10.20', addressing: 'static' },
      { ic_number: '6450212fb9e7a31', ip_address: '192.168.10.21', addressing: 'static' },
      { ic_number: '6450212fb9e7b08', ip_address: '192.168.10.124', addressing: 'dhcp' },
    ],
  },
  ip_range: '192.168.10.2 – 192.168.10.254',
  subnet_mask: '255.255.255.0',
  gateway: '192.168.10.1',
  dns: '192.168.10.1, 8.8.8.8',
  components_correct_subnet: true,
  connection_method: 'local_network',

  // 4. Technologie
  pv_present: true,
  pv_control_method: 'logger',
  datalogger_connected_to_network: true,
  logger_control_enabled: true,
  inverters_connected_to_datalogger: true,
  datalogger_table: {
    rows: [
      { logger_type: 'Huawei SmartLogger3000A01EU', total_inverter_power_kw: 300, installed_pv_power_kwp: 374, ip_tcp_address_port: '192.168.10.40:502', modbus_id: '0', fw_version: 'V300R023C10SPC120' },
      { logger_type: 'Huawei SmartLogger3000A01EU', total_inverter_power_kw: 100, installed_pv_power_kwp: 124, ip_tcp_address_port: '192.168.10.41:502', modbus_id: '0', fw_version: 'V300R023C10SPC120' },
    ],
  },
  bess_present: true,
  battery_components_connected: true,
  battery_type: t('Huawei LUNA2000-215-2S10 (2 ks, celkem 430 kWh)', 'Huawei LUNA2000-215-2S10 (2 units, 430 kWh total)'),
  battery_capacity_kwh: 430,
  battery_max_soc: 95,
  battery_min_soc: 10,
  battery_components_table: {
    rows: [
      { component: 'INV/PCS 1', capacity_kwh: 215, inverter_max_power_kw: 108, modbus_rtu_or_ip_address: '192.168.10.51:502, ID 1', mbms_order: '1' },
      { component: 'INV/PCS 2', capacity_kwh: 215, inverter_max_power_kw: 108, modbus_rtu_or_ip_address: '192.168.10.52:502, ID 1', mbms_order: '2' },
      { component: 'MBMS', capacity_kwh: 430, inverter_max_power_kw: 216, modbus_rtu_or_ip_address: '192.168.10.50:502, ID 1', mbms_order: '—' },
    ],
  },
  battery_notes: t(
    'Obě skříně řízeny přes MBMS. Dostupnost ověřena příkazem ping z PLC (RE-EMS/DŘ).',
    'Both cabinets are controlled via the MBMS. Reachability verified by ping from the PLC (RE-EMS/DŘ).',
  ),
  meteo_station_installed: true,
  meteo_station_irradiance_placement: true,
  meteo_station_correct_subnet: true,
  meteo_station_ip: '192.168.10.60',
  compensation_installed: true,
  compensation_affects_fve_control: false,
  compensation_blocking_enabled: true,

  // 5. Nastavení systému
  main_breaker_current: 1000,
  main_breaker_current_vn_equivalent: 18,
  reserved_capacity_sop: 630,
  reserved_power_plant_capacity_sop: 450,
  total_installed_power_sop: 498,
  reserved_capacity_quarter_hour_max: 600,
  test_operation_overflow_allowed: true,
  allowed_overflow_value: 100,
  electricity_purchase_contract_type: 'spot',
  electricity_sale_contract_type: 'spot',
  spot_purchase_vt_cost: 62.5,
  spot_purchase_nt_cost: 18.4,
  spot_purchase_daily_cost: 9.8,
  spot_purchase_vat: 21,
  spot_sale_grid_fee: 3.2,
  spot_sale_vat: 21,
  spot_sale_min_profit: 5,
  block_negative_spot_price_export: true,
  spot_control_enabled: true,
  battery_discharge_to_grid_spot: true,
  battery_amortization_spot: 55,
  battery_losses: 4.5,
  additional_sources_installed: false,
  battery_mode: 'spot_control',
  opto_isolator_installed_billing_meter: true,
  opto_isolator_connected_switchboard: true,
  quarter_hour_switchboard_connected_ems: true,
  cib_address_ak_puls: 'D226',
  imp1: t('A+ činná energie – odběr', 'A+ active energy – import'),
  imp2: t('A− činná energie – dodávka', 'A− active energy – export'),
  imp3: t('Synchronizační impulz ¼h (SYNC)', '¼h synchronisation pulse (SYNC)'),
  stage1_battery_compensation: true,
  stage2_device1_shutdown: true,
  stage2_device1_max_power: 45,
  stage3_device2_shutdown: true,
  stage3_device2_max_power: 30,
  stage4_device_shutdown: true,
  stage4_device_max_power: 22,
  stage5_device_shutdown: true,
  stage5_device_max_power: 15,
  aggregator_device_connected: true,
  aggregator_name: t('FlexAgregátor a.s. (ukázka)', 'FlexAggregator Ltd. (example)'),

  // 6. Dodané podklady a podpis
  photos_control_unit_displays: true,
  photos_technology_nameplates: true,
  technical_datasheets: true,
  modbus_register_table: true,
  switchboard_documentation_with_signals: true,
  single_line_diagram: true,
  site_layout_diagram: true,
  connection_agreement: true,
  distribution_portal_screenshot: true,
  filled_by_name: 'Tomáš Kratochvíl',
  filled_by_company: 'ElektroMontáže Jih s.r.o.',
  filled_place: 'Modřice',
  filled_date: DATE,

  // 7. Poznámky
  general_notes: t(
    'Regulační stupně 2–5: 2 = VZT hala A (45 kW), 3 = chlazení skladu (30 kW), 4 = kompresorovna (22 kW), ' +
      '5 = nabíjecí stanice VZV (15 kW). Odpojení přes stykače v RMaR1/RMaR2, signály doplněny do dokumentace rozvaděčů. ' +
      'Kompenzace (RC1) blokována přes beznapěťový kontakt z RE-EMS/DŘ.',
    'Regulation stages 2–5: 2 = Hall A ventilation (45 kW), 3 = warehouse cooling (30 kW), 4 = compressor room (22 kW), ' +
      '5 = forklift charging station (15 kW). Disconnection via contactors in RMaR1/RMaR2; signals added to the switchboard documentation. ' +
      'Compensation (RC1) blocked via a volt-free contact from RE-EMS/DŘ.',
  ),
};

/** Fields whose help illustration doubles as the example photo. */
const assetPhotos: Record<string, string> = {
  voltage_current_correspondence_check: '02-fig2-indirect-metering-wiring.png',
  mtp_ratio_set: '02-mtp-setting-example.png',
  voltage_level_measured_set: '02-parameter-overview-p01-p05.png',
  cloud_connectivity_note: '03-plc-display-connection-status.png',
  photos_control_unit_displays: '03-plc-display-ic-number.jpeg',
  cib_address_ak_puls: '05-ak-puls-cib-address-label.png',
  switchboard_documentation_with_signals: '06-switchboard-documentation-example.png',
};

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);

async function post(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${init.method} ${url} -> ${res.status}: ${await res.text()}`);
  return res;
}

const instance = await createInstance({ checklistSlug: 'rtu-ems', label, lang });
const token = instance.token;
console.log(`created ${instance.id} (v${instance.checklistVersion})`);

await post(`${base}/api/f/${token}/answers`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ updates: Object.entries(values).map(([fieldId, value]) => ({ fieldId, value })) }),
});
console.log(`saved ${Object.keys(values).length} answers`);

// Photos and signature.
const loaded = (await loadByToken(token))!;
const photoFields = loaded.checklist.sections
  .flatMap((s) => s.fields)
  .filter((f) => f.photo && isVisible(f, loaded.state.values));

const { chromium } = await import('playwright');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });

async function upload(fieldId: string, kind: 'photo' | 'signature', data: Buffer, filename: string, mime: string) {
  const form = new FormData();
  form.set('file', new File([new Uint8Array(data)], filename, { type: mime }));
  form.set('fieldId', fieldId);
  form.set('kind', kind);
  await post(`${base}/api/f/${token}/attachments`, { method: 'POST', body: form });
}

for (const [i, f] of photoFields.entries()) {
  const asset = assetPhotos[f.id];
  if (asset) {
    const mime = asset.endsWith('.png') ? 'image/png' : 'image/jpeg';
    await upload(f.id, 'photo', fs.readFileSync(path.join(assets, asset)), asset, mime);
    continue;
  }
  const hue = (i * 47) % 360;
  await page.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0;width:1280px;height:960px;
    font-family:system-ui,sans-serif;color:#fff;display:flex;flex-direction:column;justify-content:space-between;
    background:linear-gradient(135deg,hsl(${hue} 30% 32%),hsl(${(hue + 40) % 360} 25% 18%));">
    <div style="padding:48px 56px;font-size:28px;letter-spacing:.2em;opacity:.75">${t('UKÁZKOVÁ FOTOGRAFIE', 'EXAMPLE PHOTO')}</div>
    <div style="padding:0 56px;font-size:54px;font-weight:600;line-height:1.2">${esc(lang === 'en' ? f.labelEn : f.labelCs)}</div>
    <div style="padding:48px 56px;font-size:24px;opacity:.8;display:flex;justify-content:space-between">
      <span>${esc(PROJECT)}</span><span>${DATE} · IMG_${4210 + i}.jpg</span></div></body>`);
  const jpg = await page.screenshot({ type: 'jpeg', quality: 80 });
  await upload(f.id, 'photo', jpg, `IMG_${4210 + i}.jpg`, 'image/jpeg');
}
console.log(`uploaded ${photoFields.length} photos`);

await page.setViewportSize({ width: 600, height: 200 });
await page.setContent(`<!doctype html><body style="margin:0;background:#fff">
  <svg width="600" height="200" viewBox="0 0 600 200" fill="none" stroke="#1a237e" stroke-width="3.5"
       stroke-linecap="round" stroke-linejoin="round">
    <path d="M60 70 C 90 55, 130 55, 160 62 M110 60 C 108 95, 104 130, 98 160"/>
    <path d="M150 120 C 140 140, 165 150, 172 128 C 178 110, 160 108, 158 125 C 170 150, 190 140, 198 118
             C 205 140, 215 145, 228 120 C 236 108, 240 140, 252 128 C 262 112, 270 105, 278 125
             C 284 140, 300 138, 306 118"/>
    <path d="M330 60 C 335 100, 332 135, 328 162 M330 112 C 350 90, 370 85, 360 105 C 352 120, 365 140, 392 150"/>
    <path d="M395 125 C 405 110, 415 112, 418 125 C 425 145, 440 130, 448 115 C 452 135, 470 140, 482 118
             C 492 100, 505 130, 520 122 C 535 115, 548 112, 560 120"/>
    <path d="M70 178 C 200 170, 380 168, 540 174" stroke-width="2"/>
  </svg></body>`);
await upload('signature', 'signature', await page.screenshot({ type: 'png' }), 'signature.png', 'image/png');
await browser.close();
console.log('uploaded signature');

// Every visible input should now hold a value — required or not.
const final = (await loadByToken(token))!;
const missing = final.checklist.sections
  .flatMap((s) => s.fields)
  .filter((f) => isInput(f) && f.type !== 'signature' && isVisible(f, final.state.values))
  .filter((f) => !hasValue(f, final.state.values[f.id]))
  .map((f) => f.id);
const jps = final.checklist.sections.flatMap((s) => s.fields).find((f) => f.id === 'switchboard_jps_labels')!;
console.log(`visible JPS rows: ${visibleFixedRows(jps, final.state.values).length}/${jps.fixedRows!.length}`);
if (missing.length) console.log(`WARNING: visible fields left empty: ${missing.join(', ')}`);
const summary = summarize(final.checklist, final.state);
console.log(`completeness ${summary.percent}%, problems: ${summary.problems.length}, failed checks: ${summary.failedChecks.length}`);

if (!noSubmit) {
  const res = await post(`${base}/api/f/${token}/submit`, { method: 'POST' });
  console.log(`submit -> ${res.status}`);
}
console.log(`id=${instance.id}`);
console.log(`link=${base}/f/${token}`);
console.log(`admin=${base}/admin/${instance.id}`);
process.exit(0);
