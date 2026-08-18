# Deployment

The app is a standard Next.js standalone server in Docker. It needs Postgres and somewhere
to put uploaded files.

## Quick start (app + Postgres in Docker)

```bash
cp .env.example .env
# set at minimum: ADMIN_PASSWORD, SESSION_SECRET, PUBLIC_BASE_URL, POSTGRES_PASSWORD
docker compose up -d --build
docker compose exec app npm run db:migrate
docker compose exec app npm run db:sync-schema
```

`PUBLIC_BASE_URL` must be the URL installers will actually open (e.g.
`https://checklist.example.com`) — the customer links shown in the admin are built from it.

Put a TLS-terminating reverse proxy (nginx, Caddy, Traefik) in front. Uploads can reach
~10 MB per file, so raise the proxy's body limit accordingly — for nginx:
`client_max_body_size 12m;`.

## Using managed Postgres instead

Remove the `db` service from `docker-compose.yml` and point `DATABASE_URL` at your
instance — a Supabase/Neon/RDS connection string works as-is. Run the two `db:` commands
above once against it.

## File storage

| `STORAGE_DRIVER` | Where files go |
|---|---|
| `local` (default) | `STORAGE_LOCAL_PATH`, mounted as the `uploads` Docker volume. Back this up. |
| `s3` | Any S3-compatible bucket — MinIO, Supabase Storage, AWS S3. |

For `s3`, set `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and
optionally `S3_REGION` / `S3_PREFIX`. The bucket must stay **private**: files are always
served through the app's `/api/files/:id` route, which requires either an admin session or
the form's own link token. Nothing relies on bucket ACLs.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string |
| `ADMIN_PASSWORD` | yes | Password for `/admin` |
| `SESSION_SECRET` | yes | Signs the admin session cookie; ≥16 chars, random |
| `PUBLIC_BASE_URL` | yes | Base URL used to build customer links |
| `STORAGE_DRIVER` | no | `local` (default) or `s3` |
| `STORAGE_LOCAL_PATH` | no | Upload directory for the local driver |
| `MAX_UPLOAD_BYTES` | no | Per-file limit, default 10 MB |
| `DATABASE_POOL_MAX` | no | Connection pool size, default 10 |

## Upgrading

```bash
git pull
docker compose up -d --build
docker compose exec app npm run db:migrate      # if there are new migrations
docker compose exec app npm run db:sync-schema  # if any checklist changed
```

Neither command touches forms that already exist: each instance carries its own copy of the
checklist definition it was created with.

## Backups

Two things hold state:

1. **Postgres** — all answers, statuses and the audit trail. `pg_dump` on a schedule.
2. **The uploads volume** (or the S3 bucket) — the photos and signatures.

Restore both together; a database row referencing a missing file renders as a broken
attachment.

## Security notes

- Form links are unguessable (160-bit tokens) and are the only credential an installer
  needs — treat them as secrets, and don't put them in public tickets.
- The form pages send `noindex`, but access control comes from the token, not from that.
- Admin sessions last 12 hours and are signed with `SESSION_SECRET`; changing that secret
  invalidates every session immediately.
- Only images and PDFs are accepted as uploads, and they're served with the stored
  content type from a route that checks authorization on every request.
