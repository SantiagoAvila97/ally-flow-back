import { createApp } from './app';
import { env } from './config/env';
import { bootstrapDatabase } from './db/bootstrap';

async function main(): Promise<void> {
  await bootstrapDatabase();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║         Ally Flow API  ·  MVP            ║
  ╠══════════════════════════════════════════╣
  ║  env: ${String(env.appEnv).padEnd(34)}║
  ║  cors: ${env.corsOrigins.join(', ').slice(0, 32).padEnd(33)}║
  ║  http://localhost:${String(env.port).padEnd(5)}                   ║
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
