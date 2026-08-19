# Editing and adding checklists

A checklist is a directory under `checklists/`, containing a `checklist.yaml` and one
markdown file per section. Each section file has a single fenced ` ```yaml ` block with a
`fields:` list. Everything outside that block is documentation for whoever edits the file —
the leading blockquote becomes the section's intro text shown to the installer, and a
blockquote starting with `**_notes**` is maintainer-only and never displayed.

After any edit:

```bash
npm run check          # compile + validate + typecheck
npm run db:sync-schema # publish the new definition
```

`npm run check` fails on a broken definition (unknown key, missing option, a
`conditional_on` pointing at a field that doesn't exist or appears later in the form), so a
bad form edit can't reach production.

## Field keys

```yaml
- id: phase_sequence_check        # stable snake_case key — NEVER rename once in use;
                                  # answers are stored against it
  type: boolean                   # text | number | boolean | select | date | signature
                                  # | table | note | group
  label_cs: "Kontrola sledu fází"
  label_en: "Phase-sequence check"
  help_cs: "…"                    # inline help / the original Legend text
  help_en: "…"
  required: false                 # defaults to true for input fields
  unit: kW                        # numbers
  multiline: true                 # long free text
  options:                        # boolean shorthand — the exact ANO/NE wording
    {true: {cs: "ANO", en: "Yes"}, false: {cs: "NE", en: "No"}}
  conditional_on: {field: meteo_station_installed, equals: true}
  # or, to gate on a count: shown only while the answer is greater than 0
  conditional_on: {field: mar_switchboard_count, gt: 0}
  images:
    - {file: assets/…png, caption_cs: "…", caption_en: "…"}
```

A `conditional_on` takes exactly one operator, `equals` or `gt`, and must reference a
field that appears **earlier** in the form; the compiler enforces both. `gt` only works on
a `number` field and keeps the gated field hidden while the gate is unanswered — which is
what you want for "how many are installed?" gating "are they wired up?".

A hidden field is not required and not counted toward completeness, so gating is the way
to keep an inapplicable blocking check from forcing a false NE.

### Blocking checks

```yaml
  blocking: true                  # boolean only: answering NE is a failure
  on_fail:                        # optional; defaults to note required, photo not
    require_note: true
    require_photo: true
```

A blocking check answered NE opens an explanation box under the field, flags the whole
form as `issues` in the admin list, and blocks submission until the explanation (and photo,
if required) is supplied. It does **not** stop the installer from filling in later sections —
losing the rest of a site visit's data would cost more than it gains.

### Photo evidence

```yaml
  photo: true                     # offer photo/PDF attachments on this field
  photo_required: true            # at least one file needed for completeness
```

`photo: true` works on any field type, including `note` — that's how the §3 "attach a photo
of the PLC display showing cloud registration [100]" item is modelled.

### Tables

```yaml
- id: additional_meters_table
  type: table
  repeatable: true                # installer can add/remove rows freely
  suggested_rows: 4               # how many blank rows to start with
  columns:
    - {id: meter_type, label_cs: "Typ", label_en: "Type", type: text}
  fixed_rows:                     # only for repeatable: false — labelled rows
    - {row_id: mar1, label_cs: "MaR1", label_en: "MaR1"}
```

## Versioning

`checklist.yaml` carries a `version`. When a form instance is created, the compiled
definition is **copied into that instance**, so edits in git never change a form someone is
already filling in — or one already submitted.

- Fixing a typo or clarifying help text: edit in place, keep the version.
- Adding/removing/re-meaning fields: bump `version`. New links use the new version;
  existing ones keep the old.

## Adding a whole new checklist

Create `checklists/<slug>/` with a `checklist.yaml` (see the RTU/EMS one for the shape) and
its section files, then `npm run check && npm run db:sync-schema`. It appears in the admin's
checklist picker automatically. Sections and fields can be copied between checklists — field
`id`s only need to be unique within one checklist.
