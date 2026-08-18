# EMS Checklist

Web application for filling in EnergoStation EMS / dispatch-control (DŘ) installation
and commissioning checklists on site.

- An admin creates a **one-off link** per installation; the installer opens it with no login.
- **Every field autosaves.** The form can be closed and resumed from the same link at any time.
- A check answered **NE** requires a written explanation (and a photo where configured) and
  flags the whole form as *having issues* — the installer can still carry on with the rest.
- **Photos** and a drawn **signature** are attached directly to the fields they document.
- The admin sees all forms, every field value, every uploaded file, and a full audit trail.
- Fully **bilingual CZ / EN**, switchable inside the form.

The checklist definitions live in this repository as markdown + YAML, so changing a form
is a normal code change with a normal diff and review.

## Layout

| Path | What it is |
|---|---|
| [checklists/rtu-ems/](checklists/rtu-ems/) | The RTU/EMS v7 checklist: one file per section, plus `checklist.yaml` and image assets. **This is the form.** |
| [scripts/compile-schema.ts](scripts/compile-schema.ts) | Validates and compiles the checklist into JSON. Fails the build on a bad definition. |
| [src/lib/checklist/](src/lib/checklist/) | Compiled types, the compiler, and the completeness/blocking rules shared by browser and server. |
| [src/app/f/[token]/](src/app/f/) | The installer-facing form. |
| [src/app/admin/](src/app/admin/) | Admin: sign in, create links, inspect answers. |
| [src/db/schema.ts](src/db/schema.ts) | Database tables. |
| [input-dump/](input-dump/) | Original source documents and earlier LaTeX attempts. Archive — nothing reads from it. |

## Running it locally

```bash
cp .env.example .env          # then set ADMIN_PASSWORD and SESSION_SECRET
npm install
npm run compile-schema        # validate + compile the checklists
npm run db:migrate            # create the tables
npm run db:sync-schema        # publish the checklists into the database
npm run dev
```

Open <http://localhost:3000/admin>, sign in with `ADMIN_PASSWORD`, and create a form.

## Deploying

```bash
cp .env.example .env   # set ADMIN_PASSWORD, SESSION_SECRET, PUBLIC_BASE_URL
docker compose up -d --build
```

The app migrates the database and publishes the checklists on startup.

See [docs/DEPLOY.md](docs/DEPLOY.md) for storage options, upgrades and backups.

## Editing a checklist

See [docs/AUTHORING.md](docs/AUTHORING.md). In short: edit the YAML in
[checklists/rtu-ems/](checklists/rtu-ems/), run `npm run check`, commit. Forms already
in the field keep the definition they were created with.
