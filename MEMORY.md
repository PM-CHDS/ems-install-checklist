# EMS Checklist — Memory / Decisions / Design

Living document: findings, decisions and design for the EMS commissioning checklist
web app. Update it as decisions change. Operational docs live in
[README.md](README.md), [docs/AUTHORING.md](docs/AUTHORING.md) and
[docs/DEPLOY.md](docs/DEPLOY.md).

## Goal

Installers/customers fill EMS (energy management system) configuration & commissioning
checklists on site, from a link:

- Admin generates a **custom link** per installation; installer opens it — **no login**.
- **Every field autosaves**; resumable from the same link even if never finished.
- A check answered **NE** requires a written explanation (+ photo where configured) and
  flags the form as *having issues* — installer can still continue (no hard stop).
- **Photo uploads** and a drawn **signature**.
- **Admin view**: all forms, exact per-field values, files, full audit trail.
- **Bilingual CZ/EN**.
- **Form definitions live as code in this git repo**.

MVP = `Checklist_Instalace_RTU-EMS_v7` as a web form. **Built and verified — see Status.**

## Decisions (2026-08-18)

| Decision | Choice | Why |
|---|---|---|
| Frontend | Custom **Next.js 15** app (App Router, React 19, TS, Tailwind v4) | Airtable's native forms can't do resumable tokenized links, per-step blocking, or schema-as-code. A custom frontend was required regardless of the backend. |
| Backend | **Postgres** (Drizzle ORM), **not Airtable** | Real relational data, no API rate limits, admin built into the same app. Works with managed Postgres (Supabase/Neon/RDS) or the bundled container. |
| Hosting | **Self-hosted, Docker** | `Dockerfile` + `docker-compose.yml` ship app + Postgres + an uploads volume. |
| Fail/blocking | NE ⇒ **require note (+ photo where configured), flag `issues`**, don't hard-stop | Keeps the rest of a site visit's data; a hard stop risks an abandoned form and zero data. |
| Schema source of truth | **Markdown + YAML in `checklists/`**, compiled to JSON | Form edits are ordinary reviewable diffs. `npm run check` fails on a bad definition. |
| Admin auth | **Password + signed session cookie** (`ADMIN_PASSWORD`, `SESSION_SECRET`) | *Deviation from the original plan's magic-link.* Self-hosted MVP shouldn't require a mail provider or external identity service. Swappable later. |
| File storage | **Adapter**: `local` disk (default) or `s3` (MinIO / Supabase Storage / AWS) | Bucket stays private; files always served through an authorizing app route. |
| Instance versioning | Compiled definition is **snapshotted onto each form instance** | Editing the schema in git never changes a form already in the field. |

## Key architecture facts

```
checklists/rtu-ems/*.md  ──compile+validate──>  JSON definition
                                                     │ snapshot per instance
Next.js (Docker) ────────────────────────────────────┤
  /f/[token]  installer: stepper, autosave, CZ/EN, photos, signature, fail flow
  /admin      admin: sign in, create links, per-field answers, audit trail, JSON export
        │                        │
   Postgres (5 tables)     storage adapter (local disk | S3)
```

- **Tables**: `checklists` (published definitions), `form_instances` (token + snapshot +
  status), `answers` (one row per field, upserted), `attachments`, `events` (append-only
  audit log — this is what gives the admin "exact inserts per field").
- **Status flow**: `created → in_progress → issues? → submitted → reviewed`. Status is
  *derived* from the answers on every save, never set by the client.
- **One validation engine** (`src/lib/checklist/state.ts`) runs in both the browser (live
  feedback) and the server (authoritative at submit), so they can't disagree.
- **Schema keys added for the web form** (not in the source document): `blocking`,
  `on_fail: {require_note, require_photo}`, `photo`, `photo_required`. Documented in
  `docs/AUTHORING.md`.
- RTU-EMS v7 compiles to **8 sections, 127 fields (110 inputs, 31 blocking checks,
  24 conditionals, 20 photo-capable fields)**.

### Non-obvious implementation notes

- A `signature` field's answer *is* its attachment. Both halves matter: the server writes
  an `answers` row on upload, **and** the client folds saved signatures into the values its
  completeness rules see. Missing either one leaves Submit permanently disabled.
- **The container migrates and publishes checklists itself on startup**
  (`src/lib/bootstrap.ts` via `src/instrumentation.ts`); there is no separate deploy step
  to forget. `AUTO_BOOTSTRAP=false` disables it for multi-replica setups. Bootstrap reads
  the compiled JSON in `generated/`, not the markdown, so the YAML parser and checklist
  sources stay out of the runtime image.
- Autosave must be drained before submit: `flushNow()` waits for in-flight requests and
  anything queued behind them, and submit refuses to run while edits are unsaved.
  A late autosave can't downgrade a `submitted` form — the status update skips locked rows.
- Fixed-row tables are **positional** (row 2 = MaR1). Never filter their blank rows in a
  view or export; render the labels alongside.
- Autosave batches all pending fields into one request, retries with backoff, and only
  clears an entry if it didn't change while in flight — designed for flaky switchroom
  connectivity.
- Photos are downscaled in the browser before upload (a 12 MP phone photo would otherwise
  be a ~6 MB upload).
- The §5 "¼-hour maximum" block is marked `required: false` because the source says
  "fill in only if part of the project" without giving a field to gate it on.

## Status (2026-08-18): MVP complete and verified

Verified end to end against a live Postgres, by API and in a real browser — **25/25
Playwright checks pass** (`npm run test:e2e`), against both `next start` and the
production standalone entry point (`node server.js`) on a freshly created empty database:

form renders CZ **and** EN · autosave reaches "Uloženo" · values survive a reload ·
NE opens the explanation box and flags the form `issues` · flipping back to ANO clears it
while the audit trail keeps the earlier note · conditional fields appear/hide on their gate ·
table rows add · review lists missing items and disables submit · photo upload + access
control (403 without the token) · non-image upload rejected 415 · full fill → submit 200 →
form locked read-only, further writes 409 · drawing a signature then submitting entirely
through the UI · admin sign-in (wrong password rejected), list, detail, JSON export ·
non-UUID ids 404 rather than 500 · fixed-row table labels line up with their values in
both the admin view and the export · schema compiler rejects bad `conditional_on`, typo'd
keys, `blocking` on a non-boolean and `photo_required` without `photo`.

A code review after the first commit found 11 issues; all are fixed in `6fc3ed2` and the
two that a browser test could have caught (signature submit, autosave/submit race) are now
covered by the suite.

### Not built (deliberately deferred)

PDF export of a submitted form · email notification on submit · admin editing of answers ·
the other checklists in `input-dump/` (basic, RTU-PDS verification, obchodní) — the
compiler already supports multiple checklists, they just need their sections authored ·
any Airtable mirror (would be an export job, never the system of record).

## Local dev environment notes

This machine had no Node, Postgres, Docker or sudo. Node 22 was installed to
`~/.local/node`, and a portable Postgres 17 runs from the session scratch directory. If a
future session needs the same, the pattern is: download the tarball, extract locally, and
fetch missing shared libraries with `apt-get download <pkg>` + `dpkg-deb -x`.
