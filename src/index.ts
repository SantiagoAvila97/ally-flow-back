import { createApp } from './app';
import { env } from './config/env';
import { bootstrapDatabase } from './db/bootstrap';
import { APP_VERSION } from './version';

async function main(): Promise<void> {
  await bootstrapDatabase();
  const app = createApp();
  // Railway / Docker: escuchar en todas las interfaces (si no, el healthcheck falla).
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║         Ally Flow API  ·  MVP            ║
  ╠══════════════════════════════════════════╣
  ║  env: ${String(env.appEnv).padEnd(34)}║
  ║  ver: ${String(APP_VERSION).padEnd(34)}║
  ║  cors: ${env.corsOrigins.join(', ').slice(0, 32).padEnd(33)}║
  ║  http://0.0.0.0:${String(env.port).padEnd(5)}                     ║
  ║  Health: /api/health                     ║
  ║  Login:  POST /api/auth/login            ║
  ╚══════════════════════════════════════════╝
  `);
  });
}

main().catch((err) => {
  console.error('[boot] failed:', err);
  process.exit(1);
});
