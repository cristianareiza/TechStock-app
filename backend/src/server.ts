import { createApp } from './app.js';
import { env } from './config/env.js';
import { createDatabase } from './database/connection.js';
import { seedDatabase } from './database/seed.js';

const db = createDatabase(env.dbPath);
seedDatabase(db);

const app = createApp(db);

const server = app.listen(env.port, () => {
  console.log(`\n  TechStock listo en http://localhost:${env.port}`);
  console.log(`  API disponible en http://localhost:${env.port}/api\n`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
