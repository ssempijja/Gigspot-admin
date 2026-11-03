// Starts a Gigspot API for the end-to-end tests, on its own database.
//
// 1. Creates `gigspot_e2e` (on the local embedded Postgres from `npm run db` in
//    Gigspot-api) if needed, brings its tables in line with the Prisma schema
//    and empties them. It never touches the `gigspot` dev database.
// 2. Builds the API into Gigspot-api/.e2e-dist (not dist/, which a running
//    `npm run start:dev` uses).
// 3. Seeds plans and the demo data, makes a second user a read-only `viewer`,
//    and writes the staff password and both enrolment codes to e2e/.state/
//    (gitignored) for the tests.
// 4. Runs the API on port 8100 until Playwright stops it.
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const API_DIR = resolve(process.env.GIGSPOT_API_DIR ?? join(here, '..', '..', 'Gigspot-api'));
const SERVER = process.env.E2E_PG ?? 'postgresql://postgres:postgres@localhost:5433';
const DB_NAME = 'gigspot_e2e';
const DATABASE_URL = `${SERVER}/${DB_NAME}`;
const PORT = process.env.E2E_API_PORT ?? '8100';
const STATE = join(here, '.state');

if (!/^postgresql:\/\/[^@]+@(localhost|127\.0\.0\.1):\d+$/.test(SERVER)) {
  throw new Error(`E2E_PG must be a local Postgres server, got ${SERVER}`);
}

const env = {
  ...process.env,
  DATABASE_URL,
  DEBUG: 'True',
  PORT,
  SECRET_KEY: 'e2e-secret-key-not-for-production',
  ADMIN_JWT_SECRET: 'e2e-admin-jwt-secret-not-for-production',
  ADMIN_TOTP_KEY: 'e2e-admin-totp-key-not-for-production',
  PASSWORD_HASH_ITERATIONS: '1000',
  MEDIA_ROOT: mkdtempSync(join(tmpdir(), 'gigspot-e2e-media-')),
  DEV_SEED_CREDENTIALS: join(STATE, 'credentials.txt'),
};
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
// npx is a .cmd script on Windows, which only runs through the shell.
const run = (cmd, args, options = {}) =>
  execFileSync(cmd, args, { cwd: API_DIR, env, encoding: 'utf8', shell: cmd === npx && process.platform === 'win32', ...options });
const sql = (statement, url = DATABASE_URL) =>
  run(npx, ['prisma', 'db', 'execute', '--url', url, '--stdin'], { input: statement, stdio: ['pipe', 'pipe', 'pipe'] });

rmSync(STATE, { recursive: true, force: true });
mkdirSync(STATE, { recursive: true });

try {
  sql(`CREATE DATABASE ${DB_NAME}`, `${SERVER}/postgres`);
} catch {
  // Already there from an earlier run.
}
run(npx, ['prisma', 'db', 'push', '--skip-generate'], { stdio: 'inherit' });
sql(`DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('TRUNCATE %I RESTART IDENTITY CASCADE', t);
  END LOOP; END $$;`);

run(npx, ['tsc', '-p', 'tsconfig.build.json', '--outDir', '.e2e-dist', '--incremental', 'false'], { stdio: 'inherit' });
const cli = (...args) => run(process.execPath, ['.e2e-dist/cli.js', ...args]).trim();
cli('seed-plans');
run(npx, ['ts-node', 'scripts/dev-seed.ts'], { stdio: 'inherit' });

const code = (output) => {
  const match = /([A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4})\s*$/.exec(output);
  if (!match) throw new Error(`No enrolment code in: ${output}`);
  return match[1];
};
const password = /password: (\S+)/.exec(readFileSync(env.DEV_SEED_CREDENTIALS, 'utf8'))[1];
writeFileSync(
  join(STATE, 'state.json'),
  JSON.stringify({
    password,
    admin: { email: 'admin.dev@gigspot.local', enrolment: code(cli('staff-invite', 'admin.dev@gigspot.local')) },
    viewer: { email: 'amina.nakato@example.com', enrolment: code(cli('grant-staff', 'amina.nakato@example.com', 'viewer')) },
  }),
);

const api = spawn(process.execPath, ['.e2e-dist/main.js'], { cwd: API_DIR, env, stdio: 'inherit' });
const stop = () => api.kill();
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
api.on('exit', (status) => process.exit(status ?? 0));
