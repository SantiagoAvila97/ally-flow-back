import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.port, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║         Ally Flow API  ·  MVP            ║
  ╠══════════════════════════════════════════╣
  ║  http://localhost:${String(env.port).padEnd(5)}                   ║
  ║  Health: /api/health                     ║
  ║  Login:  POST /api/auth/login            ║
  ╚══════════════════════════════════════════╝
  `);
});
