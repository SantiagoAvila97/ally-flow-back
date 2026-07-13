import { createApp } from './app';
import { env } from './config/env';
import { bootstrapDatabase } from './db/bootstrap';
import { APP_VERSION } from './version';

async function main(): Promise<void> {
  console.log(
    `[boot] starting ally-flow-api v${APP_VERSION} env=${env.appEnv} port=${env.port} db=${env.databaseUrl ? 'yes' : 'no'}`,
  );

  const app = createApp();

  // 1) Puerto abierto YA — Railway healthcheck no espera a migrate/seed.
  await new Promise<void>((resolve, reject) => {
    const server = app.listen(env.port, '0.0.0.0', () => {
      console.log(`[boot] listening on 0.0.0.0:${env.port} — GET /api/health`);
      resolve();
    });
    server.on('error', (err) => {
      console.error('[boot] listen error:', err);
      reject(err);
    });
  });

  // 2) DB en paralelo; si falla NO se mata el proceso (el health sigue OK).
  console.log('[boot] bootstrap DB…');
  try {
    await bootstrapDatabase();
    console.log('[boot] ready');
  } catch (err) {
    console.error('[boot] DB bootstrap failed — API sigue viva para healthcheck:', err);
  }
}

main().catch((err) => {
  console.error('[boot] fatal (antes de listen):', err);
  process.exit(1);
});
