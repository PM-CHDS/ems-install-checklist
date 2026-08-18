# Plan / Status

Architecture and decisions: [MEMORY.md](MEMORY.md). How to edit forms:
[docs/AUTHORING.md](docs/AUTHORING.md). How to deploy: [docs/DEPLOY.md](docs/DEPLOY.md).

## MVP — done

- [x] Repo bootstrap, Node/Next/Drizzle/Tailwind scaffold
- [x] Schema promoted to `checklists/rtu-ems/`, `checklist.yaml` metadata added
- [x] `blocking` / `on_fail` / `photo` / `photo_required` keys added across the checklist
- [x] Schema compiler with zod validation (`npm run compile-schema`, fails the build)
- [x] Postgres schema + migrations + `db:sync-schema`
- [x] Tokenized instance creation, resumable per-field autosave with retry
- [x] Form renderer: all field types, conditionals, CZ/EN, mobile-first
- [x] Photo upload (browser-side downscaling), signature pad, failed-check flow
- [x] Review step + server-authoritative submit + post-submit lock
- [x] Admin: sign in, create link, list with progress, per-field detail, audit trail, JSON export
- [x] Dockerfile + docker-compose + `.env.example` + docs
- [x] End-to-end verification: 21/21 browser checks (`npm run test:e2e`) plus API-level checks

## Next up, roughly in order of value

1. **Field trial** — run one real installation through it and watch what the installer
   actually struggles with. Everything below is a guess until that happens.
2. **PDF export** of a submitted checklist, so it can be filed/emailed like the paper form.
3. **Email on submit** to `projekty@energostation.com` (needs an SMTP config decision).
4. **The remaining checklists** from `input-dump/` — basic EMS, RTU/PDS communication
   verification, obchodní. Same authoring format; no code changes expected.
5. **Offline resilience** — the autosave queue survives a flaky connection but not a closed
   tab. If site conditions demand it, persist the queue to IndexedDB.
6. **Admin polish** — filters/search on the list, editing answers, resend/revoke a link.
