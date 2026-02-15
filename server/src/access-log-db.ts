import Database, { Database as DatabaseType } from 'better-sqlite3';

const ACCESS_LOG_SCHEMA = `
  CREATE TABLE IF NOT EXISTS memory_access_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_hash TEXT NOT NULL,
    accessed_at REAL NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_access_log_at ON memory_access_log(accessed_at);
`;

let accessLogDb: DatabaseType | null = null;

function deriveAccessLogPath(): string {
  const mainPath = process.env.MEMORY_DB_PATH;
  if (!mainPath) {
    throw new Error('ACCESS_LOG_DB_PATH ou MEMORY_DB_PATH requis pour la base access log.');
  }
  return mainPath.replace(/\.db$/, '_access.db');
}

export function getAccessLogDb(): DatabaseType {
  if (!accessLogDb) {
    const dbPath = process.env.ACCESS_LOG_DB_PATH || deriveAccessLogPath();
    accessLogDb = new Database(dbPath);
    accessLogDb.exec(ACCESS_LOG_SCHEMA);
  }
  return accessLogDb;
}

export function closeAccessLogDb(): void {
  if (accessLogDb) {
    accessLogDb.close();
    accessLogDb = null;
  }
}
