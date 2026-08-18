import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

declare global {
  // eslint-disable-next-line no-var
  var __emsPg: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __emsDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env and point it at your Postgres.',
    );
  }
  // Reuse the pool across dev hot-reloads so we don't exhaust connections.
  const client =
    globalThis.__emsPg ??
    postgres(url, {
      max: Number(process.env.DATABASE_POOL_MAX) || 10,
      prepare: false,
    });
  if (process.env.NODE_ENV !== 'production') globalThis.__emsPg = client;
  return drizzle(client, { schema });
}

/**
 * Connected lazily on first query: `next build` imports these modules to collect
 * page data, and a build machine has no database.
 */
export const db = new Proxy({} as ReturnType<typeof connect>, {
  get(_target, prop, receiver) {
    globalThis.__emsDb ??= connect();
    return Reflect.get(globalThis.__emsDb, prop, receiver);
  },
});

export { schema };
