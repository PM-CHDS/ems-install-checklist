# EMS/DŘ Installation Checklist — form schema

> **This directory is the live form definition.** It is compiled and validated by
> `npm run compile-schema` and rendered by the web app. For how to edit it — the full
> field-key reference, blocking checks, photo evidence, versioning — see
> [`docs/AUTHORING.md`](../../docs/AUTHORING.md). What follows documents how this schema
> was derived from the original document and the judgment calls made along the way.

Source of truth: `input-dump/EMS-install-checklist/checklist-ems-full.pdf` (the 2026
"EMS FULL" checklist) and its guide `checklist-ems-full-navod.pdf`, authored by
EnergoStation s.r.o. The schema was first converted from `Checklist_Instalace_RTU-EMS_v7.docx`
and then reviewed against the 2026 documents; the sections and footnote tables below still
describe that first conversion where the 2026 documents didn't change them. This directory
is a structured, git-friendly re-encoding of the documents' fillable content, intended as
the schema a web form is generated from.

The original document is Czech-only. Every field below carries both the original Czech
label (`label_cs`, verbatim from the source) and an English translation (`label_en`,
added during this conversion — not present in the source). Same for help text
(`help_cs` / `help_en`).

## File layout

One file per checklist section, in document order:

| File | Source section |
|---|---|
| `_cover.md` | Cover page project/contact fields |
| `01-elektroinstalace.md` | §1 Elektroinstalační práce |
| `02-elektromery.md` | §2 Elektroměry |
| `03-parametrizace-komunikace.md` | §3 Parametrizace a komunikace |
| `04-technologie.md` | §4 Technologie |
| `05-nastaveni-systemu.md` | §5 Nastavení systému |
| `06-dodane-podklady.md` | §6 Dodané podklady spolu s checklistem + sign-off block |
| `07-poznamky.md` | §7 Poznámky (free-text notes) |

**§8 "Legenda" (glossary) is not its own file.** It was prose explaining §1–§6 items — that
text has been folded into each field's `help_cs`/`help_en` at the matching field, so a
form renderer can show it as inline help/tooltip text without a separate lookup.

## Field object shape

Each section file has one fenced ` ```yaml ` block: `fields:` — a flat list of field
objects in document order (nesting is expressed via `group` labels, not YAML nesting, so
sibling fields stay easy to diff). Field object keys:

- `id` — stable English snake_case key. Never rename once a web form depends on it;
  if the source label changes, keep the `id` and just update the label fields.
- `label_cs` / `label_en` — display label.
- `type` — one of:
  - `text` — short free text. `multiline: true` marks a long free-text/notes area.
  - `number` — numeric input. `unit` (e.g. `A`, `kW`, `kWp`, `%`, `EUR/MWh`) if applicable.
  - `boolean` — yes/no. Source renders these as literal `ANO`/`NE` (or in one case
    `uvnitř`/`venku`) written on the page for the installer to circle by hand; `options`
    carries the exact source wording so the translation is auditable.
  - `select` — single choice from `options` (>2 choices, or a same-meaning pair that
    isn't literally "yes/no").
  - `date`, `signature` — as named.
  - `table` — repeating or fixed-row structured data; see below.
  - `note` — display-only text, no input (declarations, warnings, instructions to
    attach photos). `severity: warning` marks the one explicit warning callout (§5).
  - `group` — a heading with no input of its own, used to visually nest the fields that
    follow it (mirrors the source document's sub-headings). Nesting ends at the next
    `group` field of equal or shallower level, or end of file.
- `help_cs` / `help_en` — glossary/footnote explanation, where the source provided one.
  Omitted where the source has no explanation.
- `images` — optional list of `{file, caption_cs, caption_en}`. Files live in
  `schema/assets/`, extracted from the source docx's `word/media/` (docx is a zip).
  Present only on the field the image actually illustrates, matched by its position in
  the source XML relative to surrounding paragraph text — not on every field, and not
  guessed onto a field the source doesn't place it near.
- `required` — omitted (defaults to true) unless conditional or explicitly optional in
  the source.
- `blocking` — boolean checks only: answering the failing option (NE) is treated as "this
  step didn't go through". The web form then demands an explanation, flags the whole form
  as *having issues*, and refuses submission until it's explained — but lets the installer
  continue with the remaining sections. `on_fail: {require_note, require_photo}` overrides
  the default (note required, photo not). These keys were added for the web form; they are
  not in the source document.
- `photo` / `photo_required` — offer file attachments on this field, and require at least
  one for the field to count as complete. Used where the source asks in prose for
  photo documentation (nameplates, PLC displays, the §6 document checklist).
- `conditional_on` — `{field: <id>, equals: <value>}`. Only set when an earlier field in
  the same schema actually gates this one (per source wording like "vyplňte, pokud…" /
  "fill in only if…"). Where the source implies a condition but no earlier field
  expresses it as data (e.g. "only if metering at VN level" — VN/NN isn't itself a
  field), the condition is recorded in `help_en`/`help_cs` instead of `conditional_on`.

### Tables

```yaml
- id: example_table
  type: table
  repeatable: true          # false = fixed_rows only, no add/remove in the UI
  suggested_rows: 4         # blank rows the paper form provided — not a hard cap
  columns:
    - {id: col_a, label_cs: "...", label_en: "...", type: text}
  fixed_rows:                # only present when repeatable: false
    - {row_id: x, label_cs: "...", label_en: "..."}
```

`suggested_rows` / footnotes on most tables say some version of "if you have more rows
than fit, use the Notes field" (§7) — the web form should allow adding rows freely; the
paper form's row count was a print-layout constraint, not a business rule.

## Known source-document quirks

Flagged here rather than silently "fixed", since these are judgment calls for whoever
finalizes the web form — see `_notes` block at the top of each affected section file for
detail: a mutually-exclusive choice rendered as multiple `ANO/NE` lines (battery mode,
connection method) collapsed into one `select`; a couple of legend paragraphs describing
table columns that don't actually exist in the printed table; and regulation stages 2–5
all labelled "vypnutí zařízení 1" in the 2026 source, shown here without a device number.

## Images

The source docx has 9 embedded images. 8 are body content (wiring diagrams, PLC display
photos, a device-label photo) and are extracted into `schema/assets/`, each wired to the
one field it illustrates via that field's `images` key (see field shape above):

| File | Field |
|---|---|
| `02-fig1-semi-direct-metering-wiring.png`, `02-fig2-indirect-metering-wiring.png` | `02-elektromery.md` → `voltage_current_correspondence_check` |
| `02-mtp-setting-example.png`, `02-parameter-overview-p01-p05.png` | `02-elektromery.md` → `meter_settings_heading` |
| `03-plc-display-ic-number.jpeg` | `03-parametrizace-komunikace.md` → `control_units_ip_ic_table` |
| `03-plc-display-connection-status.png` | `03-parametrizace-komunikace.md` → `cloud_connectivity_note` |
| `05-ak-puls-cib-address-label.png` | `05-nastaveni-systemu.md` → `cib_address_ak_puls` |
| `06-switchboard-documentation-example.png` | `06-dodane-podklady.md` → `switchboard_documentation_with_signals` |

The 9th image is the company logo (used in both document headers) — not extracted, not
relevant to the form schema.

## Terminology (CZ → EN)

The Czech labels keep the terms used on site; the English ones use the agreed
equivalents rather than a literal translation.

| Czech | English | Note |
|---|---|---|
| MaR (měření a regulace) | **ISC** — Instrumentation and Control panel/switchboard | `mar_*` field ids are kept for stability; only the English labels use ISC |
| DŘ (dispečerské řízení) | **Dispatching control (DSO RTU)** | Labels use the short `EMS/DSO RTU` to mirror the Czech `EMS/DŘ`; help text spells it out |
| EMS | EMS (energy management system) | |
| MTP (měřicí transformátor proudu) | **CT** — current transformer | `mtp_*` / `mtn_*` field ids are kept; English labels use CT / PT |
| MTN (měřicí transformátor napětí) | **PT** — potential transformer | |
| JPS (jednopólové schéma) | **SLD** — single-line diagram | |
| OM / OPM (odběrné místo) | metering point / offtake point | |
| SoP (smlouva o připojení) | grid connection agreement | |
| PDS | DSO (distribution system operator) | |

## Scope

This checklist covers **EMS together with dispatching control (DSO RTU)** — the same
scope as the v7 source document. Items marked `EMS/DŘ` (`EMS/DSO RTU` in English) apply
to both, and §5's intro keeps the source's instruction to fill those in even when only
dispatching control was ordered.

If a dispatching-control-only checklist is wanted later (the
`Checklist_RTU_Ověření-komunikace-s-PDS` document in `input-dump/` is the obvious
candidate), it should be its own checklist directory rather than a variant of this one.

## Source footnotes

The source docx carries 14 Word footnotes. Their text is folded into the `help_cs` /
`help_en` of the field each one annotates. Earlier revisions of this schema prefixed that
help text with a `[FN7]`-style marker; those are **removed** — they reached the installer
as literal noise in the form. This table is the traceability record instead.

| Footnote | File | Field / column |
|---|---|---|
| 2 | `01-elektroinstalace.md` | `ems_full_location` |
| 3 | `01-elektroinstalace.md` | `switchboard_jps_labels` |
| 5 | `02-elektromery.md` | `mtn_ratio_set` |
| 6 | `02-elektromery.md` | `additional_meters_table` |
| 7 | `02-elektromery.md` | `terminal_block` |
| 8 | `03-parametrizace-komunikace.md` | `control_units_ip_ic_table` |
| 9 | `04-technologie.md` | `inverters_connected_to_datalogger` |
| 10 | `04-technologie.md` | `inverters_rtu_table`, `inverters_tcp_table` |
| 11 | `04-technologie.md` | `master_slave` |
| 12 | `05-nastaveni-systemu.md` | `additional_sources_installed` |
| 13 | `06-dodane-podklady.md` | `modbus_register_table` |
| 14 | `02-elektromery.md` | `ip_or_modbus_id` |

Three source footnotes carry nothing usable:

- **FN1** is empty in the source.
- **FN4** contains only the stray character `I` — anchored on `mtn_installed`, whose help
  text comes from the Legend instead.
- FN1 and FN4 are therefore absent from the table above by design, not by omission.

**FN14 was missing until v9** — the source text ("if you have ordered driver development
for an unsupported meter, also state the communication speed and parity in the notes")
had been dropped in the original conversion. It is now on the `ip_or_modbus_id` column of
`additional_meters_table`, which is the paragraph it anchors to in the source.

To re-audit against the source: the docx is a zip; `word/footnotes.xml` holds the text and
`word/document.xml` holds `w:footnoteReference` elements marking where each one anchors.

## Relationship to the web form

`checklist.yaml` in this directory adds the checklist-level metadata (slug, version,
section order and titles, submission contact) that the section files don't carry. The
compiler in `src/lib/checklist/compile.ts` reads both, validates them, and emits the JSON
the app renders.

Section intro text comes from the leading blockquote of each section file. The
`**_notes**` blockquotes are maintainer-facing and are deliberately not shown to installers.
