import Database, { Database as DatabaseType } from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';

const DEFAULT_DB_PATH = process.env.MEMORY_DB_PATH
  || 'C:\\Users\\filli\\AppData\\Local\\Packages\\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\\LocalCache\\Local\\mcp-memory\\sqlite_vec.db';

const READONLY = process.env.MEMORY_DB_READONLY !== 'false';

let db: DatabaseType | null = null;

export function getDb(): DatabaseType {
  if (!db) {
    db = new Database(DEFAULT_DB_PATH, { readonly: READONLY });
    sqliteVec.load(db);
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
