// npm run seed -> borra la base y la vuelve a llenar
import fs from 'node:fs';
import { env } from '../config/env.js';
import { createDatabase } from './connection.js';
import { seedDatabase } from './seed.js';

for (const suffix of ['', '-wal', '-shm']) {
  fs.rmSync(`${env.dbPath}${suffix}`, { force: true });
}

const db = createDatabase(env.dbPath);
seedDatabase(db);
db.close();
console.log(`Base de datos reiniciada en ${env.dbPath}`);
