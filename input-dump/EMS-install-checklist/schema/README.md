# EMS/DŘ Installation Checklist — form schema

Source of truth: `Checklist_Instalace_RTU-EMS_v7.docx` (+ matching `.pdf`), authored by
EnergoStation s.r.o. This directory is a structured, git-friendly re-encoding of that
document's fillable content, intended as the schema a web form is generated from.

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
connection method) collapsed into one `select`; one checklist item (§6, distribution
portal screenshot) missing its `ANO/NE` marker in the source; a couple of legend
paragraphs describing table columns that don't actually exist in the printed table; and
two regulation stages (§5, stages 4 and 5) both labeled "vypnutí zařízení 2", likely a
copy-paste typo in the source that should probably read "zařízení 3" / "zařízení 4".

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
