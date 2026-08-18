import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

declare global {
  // eslint-disable-next-line no-var
  var __emsPg: ReturnType<typeof postgres> | undefined;
}

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env and point it at your Postgres.',
    );
  }
  return url;
}

// Reuse the pool across dev hot-reloads so we don't exhaust connections.
const client =
  globalThis.__emsPg ??
  postgres(connectionString(), {
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    prepare: false,
  });
if (process.env.NODE_ENV !== 'production') globalThis.__emsPg = client;

export const db = drizzle(client, { schema });
export { schema };
