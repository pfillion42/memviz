import Database, { Database as DatabaseType } from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';

export interface TestMemory {
  content_hash: string;
  content: string;
  tags: string | null;
  memory_type: string | null;
  metadata: string | null;
  created_at: number;
  updated_at: number;
  created_at_iso: string;
  updated_at_iso: string;
  deleted_at: number | null;
}

const SCHEMA = `
  CREATE TABLE memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_hash TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    tags TEXT,
    memory_type TEXT,
    metadata TEXT,
    created_at REAL,
    updated_at REAL,
    created_at_iso TEXT,
    updated_at_iso TEXT,
    deleted_at REAL DEFAULT NULL
  );

  CREATE INDEX idx_content_hash ON memories(content_hash);
  CREATE INDEX idx_created_at ON memories(created_at);
  CREATE INDEX idx_deleted_at ON memories(deleted_at);
  CREATE INDEX idx_memory_type ON memories(memory_type);

  CREATE VIRTUAL TABLE memory_content_fts USING fts5(
    content,
    content='memories',
    content_rowid='id',
    tokenize='trigram'
  );

  CREATE TRIGGER memories_fts_ai AFTER INSERT ON memories
  BEGIN
    INSERT INTO memory_content_fts(rowid, content) VALUES (new.id, new.content);
  END;

  CREATE TRIGGER memories_fts_ad AFTER DELETE ON memories
  BEGIN
    DELETE FROM memory_content_fts WHERE rowid = old.id;
  END;

  CREATE TRIGGER memories_fts_au AFTER UPDATE ON memories
  BEGIN
    DELETE FROM memory_content_fts WHERE rowid = old.id;
    INSERT INTO memory_content_fts(rowid, content) VALUES (new.id, new.content);
  END;

  CREATE TABLE memory_graph (
    source_hash TEXT NOT NULL,
    target_hash TEXT NOT NULL,
    similarity REAL NOT NULL,
    connection_types TEXT NOT NULL,
    metadata TEXT,
    created_at REAL NOT NULL,
    relationship_type TEXT DEFAULT 'related',
    PRIMARY KEY (source_hash, target_hash)
  );

  CREATE INDEX idx_graph_source ON memory_graph(source_hash);
  CREATE INDEX idx_graph_target ON memory_graph(target_hash);
  CREATE INDEX idx_graph_relationship ON memory_graph(relationship_type);

  CREATE TABLE metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS memory_access_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_hash TEXT NOT NULL,
    accessed_at REAL NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_access_log_at ON memory_access_log(accessed_at);
`;

const SEED_DATA: TestMemory[] = [
  {
    content_hash: 'hash_aaa111',
    content: 'Configuration du serveur Express avec TypeScript et CORS.',
    tags: 'express,typescript,config',
    memory_type: 'note',
    metadata: JSON.stringify({
      tags: 'express,typescript,config',
      type: 'note',
      access_count: 3,
      last_accessed_at: 1771088600,
      quality_score: 0.95,
    }),
    created_at: 1771088000,
    updated_at: 1771088100,
    created_at_iso: '2026-02-14T16:53:20.000Z',
    updated_at_iso: '2026-02-14T16:54:40.000Z',
    deleted_at: null,
  },
  {
    content_hash: 'hash_bbb222',
    content: 'Decision architecture : utiliser SQLite-vec pour le stockage vectoriel local.',
    tags: 'architecture,sqlite,decision',
    memory_type: 'decision',
    metadata: JSON.stringify({
      tags: 'architecture,sqlite,decision',
      type: 'decision',
      access_count: 1,
      last_accessed_at: 1771088500,
      quality_score: 0.88,
    }),
    created_at: 1771088200,
    updated_at: 1771088200,
    created_at_iso: '2026-02-14T16:56:40.000Z',
    updated_at_iso: '2026-02-14T16:56:40.000Z',
    deleted_at: null,
  },
  {
    content_hash: 'hash_ccc333',
    content: 'Observation : le tokenizer trigram de FTS5 fonctionne bien pour la recherche partielle.',
    tags: 'fts5,recherche',
    memory_type: 'observation',
    metadata: JSON.stringify({
      tags: 'fts5,recherche',
      type: 'observation',
      access_count: 0,
      quality_score: 0.45,
    }),
    created_at: 1771088400,
    updated_at: 1771088400,
    created_at_iso: '2026-02-14T17:00:00.000Z',
    updated_at_iso: '2026-02-14T17:00:00.000Z',
    deleted_at: null,
  },
  {
    content_hash: 'hash_ddd444',
    content: 'Memoire supprimee pour test du filtre deleted_at.',
    tags: 'test',
    memory_type: 'note',
    metadata: null,
    created_at: 1771080000,
    updated_at: 1771080000,
    created_at_iso: '2026-02-14T14:40:00.000Z',
    updated_at_iso: '2026-02-14T14:40:00.000Z',
    deleted_at: 1771085000,
  },
  {
    content_hash: 'hash_eee555',
    content: 'Pattern PowerShell pour la gestion des modules Graph API avec authentification MSAL.',
    tags: 'powershell,graph,pattern',
    memory_type: 'note',
    metadata: JSON.stringify({
      tags: 'powershell,graph,pattern',
      type: 'note',
      access_count: 5,
      last_accessed_at: 1771088700,
      quality_score: 0.85,
    }),
    created_at: 1771088600,
    updated_at: 1771088700,
    created_at_iso: '2026-02-14T17:03:20.000Z',
    updated_at_iso: '2026-02-14T17:05:00.000Z',
    deleted_at: null,
  },
  {
    content_hash: 'hash_fff666',
    content: 'Test de filtrage par date : memoire ancienne.',
    tags: 'filtre,test',
    memory_type: 'note',
    metadata: JSON.stringify({
      tags: 'filtre,test',
      type: 'note',
      access_count: 0,
      quality_score: 0.30,
    }),
    created_at: 1771000000,
    updated_at: 1771000000,
    created_at_iso: '2026-02-13T16:26:40.000Z',
    updated_at_iso: '2026-02-13T16:26:40.000Z',
    deleted_at: null,
  },
  {
    content_hash: 'hash_ggg777',
    content: 'Test de filtrage par date : memoire recente.',
    tags: 'filtre,test',
    memory_type: 'decision',
    metadata: JSON.stringify({
      tags: 'filtre,test',
      type: 'decision',
      access_count: 2,
      quality_score: 1.0,
    }),
    created_at: 1771090000,
    updated_at: 1771090000,
    created_at_iso: '2026-02-14T17:33:20.000Z',
    updated_at_iso: '2026-02-14T17:33:20.000Z',
    deleted_at: null,
  },
  {
    content_hash: 'hash_hhh888',
    content: 'Memoire avec tag express pour test filtrage multiple.',
    tags: 'express,backend',
    memory_type: 'note',
    metadata: JSON.stringify({
      tags: 'express,backend',
      type: 'note',
      access_count: 1,
      quality_score: 0.72,
    }),
    created_at: 1771088300,
    updated_at: 1771088300,
    created_at_iso: '2026-02-14T16:58:20.000Z',
    updated_at_iso: '2026-02-14T16:58:20.000Z',
    deleted_at: null,
  },
];

const SEED_GRAPH = [
  {
    source_hash: 'hash_aaa111',
    target_hash: 'hash_bbb222',
    similarity: 0.78,
    connection_types: JSON.stringify(['semantic', 'thematic']),
    metadata: JSON.stringify({ context: 'architecture projet' }),
    created_at: 1771088300,
    relationship_type: 'related',
  },
  {
    source_hash: 'hash_ccc333',
    target_hash: 'hash_bbb222',
    similarity: 0.65,
    connection_types: JSON.stringify(['semantic']),
    metadata: null,
    created_at: 1771088500,
    relationship_type: 'supports',
  },
];

const SEED_METADATA = [
  { key: 'distance_metric', value: 'cosine' },
  { key: 'fts5_enabled', value: 'true' },
];

// Acces seed : quelques entrees sur 2 jours differents
const SEED_ACCESS_LOG = [
  { content_hash: 'hash_aaa111', accessed_at: 1771000100 }, // 2026-02-13
  { content_hash: 'hash_aaa111', accessed_at: 1771000200 }, // 2026-02-13
  { content_hash: 'hash_bbb222', accessed_at: 1771088500 }, // 2026-02-14
  { content_hash: 'hash_eee555', accessed_at: 1771088600 }, // 2026-02-14
  { content_hash: 'hash_eee555', accessed_at: 1771088700 }, // 2026-02-14
];

export function createTestDb(): DatabaseType {
  const db = new Database(':memory:');
  sqliteVec.load(db);
  db.exec(SCHEMA);

  // Table vec0 pour les embeddings (384 dims, cosine)
  db.exec(`
    CREATE VIRTUAL TABLE memory_embeddings USING vec0(
      content_embedding FLOAT[384] distance_metric=cosine
    );
  `);

  const insertMemory = db.prepare(`
    INSERT INTO memories (content_hash, content, tags, memory_type, metadata,
      created_at, updated_at, created_at_iso, updated_at_iso, deleted_at)
    VALUES (@content_hash, @content, @tags, @memory_type, @metadata,
      @created_at, @updated_at, @created_at_iso, @updated_at_iso, @deleted_at)
  `);

  const insertEmbedding = db.prepare(`
    INSERT INTO memory_embeddings (rowid, content_embedding) VALUES (?, ?)
  `);

  const insertGraph = db.prepare(`
    INSERT INTO memory_graph (source_hash, target_hash, similarity,
      connection_types, metadata, created_at, relationship_type)
    VALUES (@source_hash, @target_hash, @similarity,
      @connection_types, @metadata, @created_at, @relationship_type)
  `);

  const insertMeta = db.prepare(`
    INSERT INTO metadata (key, value) VALUES (@key, @value)
  `);

  const insertAccessLog = db.prepare(`
    INSERT INTO memory_access_log (content_hash, accessed_at) VALUES (@content_hash, @accessed_at)
  `);

  const seedAll = db.transaction(() => {
    for (const m of SEED_DATA) insertMemory.run(m);
    for (const g of SEED_GRAPH) insertGraph.run(g);
    for (const m of SEED_METADATA) insertMeta.run(m);
    for (const a of SEED_ACCESS_LOG) insertAccessLog.run(a);

    // Inserer des embeddings factices pour les memoires (id 1-5)
    for (let i = 1; i <= SEED_DATA.length; i++) {
      const vec = new Float32Array(384);
      for (let j = 0; j < 384; j++) {
        vec[j] = Math.sin(i * 100 + j) * 0.1;
      }
      insertEmbedding.run(BigInt(i), Buffer.from(vec.buffer));
    }
  });

  seedAll();
  return db;
}

// Nombre de memoires non-supprimees dans le seed
export const ACTIVE_MEMORY_COUNT = SEED_DATA.filter(m => m.deleted_at === null).length;
export const TOTAL_MEMORY_COUNT = SEED_DATA.length;
export const SEED_MEMORIES = SEED_DATA;
export const SEED_GRAPH_DATA = SEED_GRAPH;
export const SEED_ACCESS_LOG_DATA = SEED_ACCESS_LOG;
