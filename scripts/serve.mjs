/**
 * Serves a production build locally the same way the container does.
 *
 * `next start` does not work with `output: 'standalone'` — Next warns and misbehaves —
 * so the supported entry point is `.next/standalone/server.js`. That directory needs the
 * static assets copied in beside it, which the Dockerfile does in its runner stage; this
 * script does the same for a local run.
 *
 * Binds to 127.0.0.1 unless HOSTNAME says otherwise: a local production check should not
 * expose an admin password to whatever network the machine is on. The Dockerfile sets
 * HOSTNAME=0.0.0.0 explicitly, where being reachable is the point.
 */
import { cpSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const standalone = path.join(root, '.next', 'standalone');

if (!existsSync(path.join(standalone, 'server.js'))) {
  console.error('No standalone build found. Run `npm run build` first.');
  process.exit(1);
}

cpSync(path.join(root, '.next', 'static'), path.join(standalone, '.next', 'static'), {
  recursive: true,
});
if (existsSync(path.join(root, 'public')))
  cpSync(path.join(root, 'public'), path.join(standalone, 'public'), { recursive: true });

// Read from the repo root so relative paths (drizzle/, generated/, var/uploads) resolve
// the same as in the container, where they sit beside server.js.
for (const dir of ['drizzle', 'generated']) {
  if (existsSync(path.join(root, dir)))
    cpSync(path.join(root, dir), path.join(standalone, dir), { recursive: true });
}

spawn(process.execPath, [path.join(standalone, 'server.js')], {
  stdio: 'inherit',
  env: {
    ...process.env,
    HOSTNAME: process.env.HOSTNAME ?? '127.0.0.1',
    PORT: process.env.PORT ?? '3000',
  },
}).on('exit', (code) => process.exit(code ?? 0));
