import dotenv from 'dotenv';
import Database from 'better-sqlite3';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDirectory = path.dirname(
  fileURLToPath(import.meta.url)
);

dotenv.config({
  path: path.join(backendDirectory, '.env')
});

const databasePath = path.resolve(
  backendDirectory,
  process.env.DATABASE_PATH || './data/tour-platform.db'
);

fs.mkdirSync(path.dirname(databasePath), {
  recursive: true
});

const db = new Database(databasePath);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = FULL');
db.pragma('busy_timeout = 5000');

export default db;