import { Router, Request, Response } from 'express';
import { Database as DatabaseType } from 'better-sqlite3';
import type { EmbedFn } from '../embedder';

interface MemoryRow {
  id: number;
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

interface GraphRow {
  source_hash: string;
  target_hash: string;
  similarity: number;
  connection_types: string;
  metadata: string | null;
  created_at: number;
  relationship_type: string;
}

function parseMemory(row: MemoryRow) {
  let metadata: unknown = row.metadata;
  try {
    if (typeof row.metadata === 'string') {
      metadata = JSON.parse(row.metadata);
    }
  } catch {
    // garder la valeur brute si le JSON est invalide
  }

  let tags: string[] = [];
  if (row.tags) {
    tags = row.tags.split(',').map(t => t.trim()).filter(Boolean);
  }

  return {
    ...row,
    tags,
    metadata,
  };
}

interface RouterOptions {
  embedFn?: EmbedFn;
}

export function createMemoriesRouter(db: DatabaseType, options: RouterOptions = {}): Router {
  const router = Router();

  // GET /api/memories/vector-search - recherche par similarite vectorielle
  router.get('/memories/vector-search', async (req: Request, res: Response) => {
    const q = req.query.q as string | undefined;
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 50);

    if (!q) {
      res.status(400).json({ error: 'Le parametre q est requis' });
      return;
    }

    if (!options.embedFn) {
      res.status(503).json({ error: 'Recherche vectorielle non disponible (embedder non charge)' });
      return;
    }

    try {
      const queryEmbedding = await options.embedFn(q);
      const queryBuffer = Buffer.from(queryEmbedding.buffer);

      const vecResults = db.prepare(`
        SELECT rowid, distance
        FROM memory_embeddings
        WHERE content_embedding MATCH ?
        ORDER BY distance
        LIMIT ?
      `).all(queryBuffer, limit) as { rowid: number; distance: number }[];

      if (vecResults.length === 0) {
        res.json({ data: [] });
        return;
      }

      const rowids = vecResults.map(r => r.rowid);
      const distanceMap = new Map(vecResults.map(r => [r.rowid, r.distance]));

      const placeholders = rowids.map(() => '?').join(',');
      const rows = db.prepare(`
        SELECT * FROM memories
        WHERE id IN (${placeholders}) AND deleted_at IS NULL
      `).all(...rowids) as MemoryRow[];

      const results = rows
        .map(row => ({
          ...parseMemory(row),
          similarity: 1 - (distanceMap.get(row.id) || 0),
        }))
        .sort((a, b) => b.similarity - a.similarity);

      res.json({ data: results });
    } catch {
      res.status(500).json({ error: 'Erreur lors de la recherche vectorielle' });
    }
  });

  // GET /api/memories/duplicates - detection de doublons vectoriels
  router.get('/memories/duplicates', async (req: Request, res: Response) => {
    const threshold = Math.min(Math.max(parseFloat(req.query.threshold as string) || 0.85, 0), 1);

    if (!options.embedFn) {
      res.status(503).json({ error: 'Detection de doublons non disponible (embedder non charge)' });
      return;
    }

    try {
      // 1. Recuperer toutes les memoires actives avec leurs IDs
      const activeMemories = db.prepare(`
        SELECT id, content_hash FROM memories WHERE deleted_at IS NULL
      `).all() as { id: number; content_hash: string }[];

      if (activeMemories.length === 0) {
        res.json({ groups: [], total_groups: 0 });
        return;
      }

      // 2. Pour chaque memoire, trouver les voisins similaires via vec0
      interface Pair {
        id1: number;
        id2: number;
        similarity: number;
      }

      const pairs: Pair[] = [];
      const processedPairs = new Set<string>();

      for (const mem of activeMemories) {
        // Recuperer l'embedding de cette memoire
        const embResult = db.prepare(`
          SELECT content_embedding FROM memory_embeddings WHERE rowid = ?
        `).get(mem.id) as { content_embedding: Buffer } | undefined;

        if (!embResult) continue;

        // Recherche KNN avec vec0
        const vecResults = db.prepare(`
          SELECT rowid, distance
          FROM memory_embeddings
          WHERE content_embedding MATCH ?
          ORDER BY distance
          LIMIT 50
        `).all(embResult.content_embedding) as { rowid: number; distance: number }[];

        // Filtrer les paires avec similarite >= threshold
        for (const vec of vecResults) {
          if (vec.rowid === mem.id) continue; // Ignorer la memoire elle-meme

          const similarity = 1 - vec.distance;
          if (similarity < threshold) continue;

          // Creer une cle unique pour eviter les doublons (A-B = B-A)
          const pairKey = [mem.id, vec.rowid].sort((a, b) => a - b).join('-');
          if (processedPairs.has(pairKey)) continue;

          processedPairs.add(pairKey);
          pairs.push({ id1: mem.id, id2: vec.rowid, similarity });
        }
      }

      if (pairs.length === 0) {
        res.json({ groups: [], total_groups: 0 });
        return;
      }

      // 3. Regrouper les paires en clusters (Union-Find)
      const parent = new Map<number, number>();
      const rank = new Map<number, number>();

      function find(x: number): number {
        if (!parent.has(x)) {
          parent.set(x, x);
          rank.set(x, 0);
        }
        if (parent.get(x) !== x) {
          parent.set(x, find(parent.get(x)!));
        }
        return parent.get(x)!;
      }

      function union(x: number, y: number): void {
        const rootX = find(x);
        const rootY = find(y);
        if (rootX === rootY) return;

        const rankX = rank.get(rootX) || 0;
        const rankY = rank.get(rootY) || 0;

        if (rankX < rankY) {
          parent.set(rootX, rootY);
        } else if (rankX > rankY) {
          parent.set(rootY, rootX);
        } else {
          parent.set(rootY, rootX);
          rank.set(rootX, rankX + 1);
        }
      }

      for (const pair of pairs) {
        union(pair.id1, pair.id2);
      }

      // 4. Grouper les IDs par cluster
      const clusters = new Map<number, Set<number>>();
      const clusterSimilarities = new Map<number, number[]>();

      for (const pair of pairs) {
        const root = find(pair.id1);
        if (!clusters.has(root)) {
          clusters.set(root, new Set());
          clusterSimilarities.set(root, []);
        }
        clusters.get(root)!.add(pair.id1);
        clusters.get(root)!.add(pair.id2);
        clusterSimilarities.get(root)!.push(pair.similarity);
      }

      // 5. Recuperer les details des memoires pour chaque cluster
      interface DuplicateGroup {
        similarity: number;
        memories: unknown[];
      }

      const groups: DuplicateGroup[] = [];

      for (const [root, idSet] of clusters.entries()) {
        if (idSet.size < 2) continue; // Un groupe doit avoir au moins 2 memoires

        const ids = Array.from(idSet);
        const placeholders = ids.map(() => '?').join(',');
        const memories = db.prepare(`
          SELECT * FROM memories
          WHERE id IN (${placeholders}) AND deleted_at IS NULL
        `).all(...ids) as MemoryRow[];

        if (memories.length < 2) continue;

        // Calculer la similarite moyenne du groupe
        const sims = clusterSimilarities.get(root) || [];
        const avgSim = sims.length > 0 ? sims.reduce((a, b) => a + b, 0) / sims.length : 0;

        groups.push({
          similarity: avgSim,
          memories: memories.map(parseMemory),
        });
      }

      // 6. Trier par similarite decroissante
      groups.sort((a, b) => b.similarity - a.similarity);

      res.json({
        groups,
        total_groups: groups.length,
      });
    } catch (error) {
      console.error('Erreur detection doublons:', error);
      res.status(500).json({ error: 'Erreur lors de la detection de doublons' });
    }
  });

  // GET /api/memories/search - doit etre avant /:hash
  router.get('/memories/search', (req: Request, res: Response) => {
    const q = req.query.q as string | undefined;
    if (!q) {
      res.status(400).json({ error: 'Le parametre q est requis' });
      return;
    }

    const rows = db.prepare(`
      SELECT m.* FROM memories m
      WHERE m.id IN (
        SELECT rowid FROM memory_content_fts WHERE memory_content_fts MATCH ?
      )
      AND m.deleted_at IS NULL
      ORDER BY m.created_at DESC
    `).all(q) as MemoryRow[];

    res.json({ data: rows.map(parseMemory) });
  });

  // GET /api/memories/stats
  router.get('/memories/stats', (_req: Request, res: Response) => {
    const totalRow = db.prepare(
      'SELECT COUNT(*) as total FROM memories WHERE deleted_at IS NULL'
    ).get() as { total: number };

    const typeRows = db.prepare(
      'SELECT memory_type, COUNT(*) as count FROM memories WHERE deleted_at IS NULL GROUP BY memory_type'
    ).all() as { memory_type: string; count: number }[];

    const byType: Record<string, number> = {};
    for (const row of typeRows) {
      byType[row.memory_type || 'unknown'] = row.count;
    }

    // Comptage par tag : extraire les tags de toutes les memoires actives
    const tagRows = db.prepare(
      'SELECT tags FROM memories WHERE deleted_at IS NULL AND tags IS NOT NULL'
    ).all() as { tags: string }[];

    const byTag: Record<string, number> = {};
    for (const row of tagRows) {
      const tags = row.tags.split(',').map(t => t.trim()).filter(Boolean);
      for (const tag of tags) {
        byTag[tag] = (byTag[tag] || 0) + 1;
      }
    }

    res.json({
      total: totalRow.total,
      byType,
      byTag,
    });
  });

  // POST /api/memories/bulk-delete - suppression en masse (soft delete)
  router.post('/memories/bulk-delete', (req: Request, res: Response) => {
    const { hashes } = req.body;

    if (!hashes || !Array.isArray(hashes) || hashes.length === 0) {
      res.status(400).json({ error: 'Le champ hashes (tableau non vide) est requis' });
      return;
    }

    const now = Date.now() / 1000;
    const placeholders = hashes.map(() => '?').join(',');

    const result = db.prepare(`
      UPDATE memories
      SET deleted_at = ?
      WHERE content_hash IN (${placeholders}) AND deleted_at IS NULL
    `).run(now, ...hashes);

    res.json({ deleted: result.changes });
  });

  // POST /api/memories/bulk-tag - ajout/retrait de tags en masse
  router.post('/memories/bulk-tag', (req: Request, res: Response) => {
    const { hashes, add_tags, remove_tags } = req.body;

    if (!hashes || !Array.isArray(hashes) || hashes.length === 0) {
      res.status(400).json({ error: 'Le champ hashes (tableau non vide) est requis' });
      return;
    }

    if (!add_tags && !remove_tags) {
      res.status(400).json({ error: 'Au moins add_tags ou remove_tags est requis' });
      return;
    }

    const now = Date.now() / 1000;
    const nowIso = new Date().toISOString();

    let updated = 0;

    const updateAll = db.transaction(() => {
      for (const hash of hashes) {
        const row = db.prepare(
          'SELECT tags FROM memories WHERE content_hash = ? AND deleted_at IS NULL'
        ).get(hash) as { tags: string | null } | undefined;

        if (!row) continue;

        // Parser les tags actuels
        let currentTags = row.tags
          ? row.tags.split(',').map(t => t.trim()).filter(Boolean)
          : [];

        // Ajouter les nouveaux tags (sans doublons)
        if (add_tags && Array.isArray(add_tags)) {
          for (const tag of add_tags) {
            if (!currentTags.includes(tag)) {
              currentTags.push(tag);
            }
          }
        }

        // Retirer les tags demandes
        if (remove_tags && Array.isArray(remove_tags)) {
          currentTags = currentTags.filter(t => !remove_tags.includes(t));
        }

        // Reconstruire la string CSV
        const newTagsStr = currentTags.length > 0 ? currentTags.join(',') : null;

        const result = db.prepare(`
          UPDATE memories
          SET tags = ?, updated_at = ?, updated_at_iso = ?
          WHERE content_hash = ?
        `).run(newTagsStr, now, nowIso, hash);

        updated += result.changes;
      }
    });

    updateAll();
    res.json({ updated });
  });

  // POST /api/memories/bulk-type - changement de type en masse
  router.post('/memories/bulk-type', (req: Request, res: Response) => {
    const { hashes, memory_type } = req.body;

    if (!hashes || !Array.isArray(hashes) || hashes.length === 0) {
      res.status(400).json({ error: 'Le champ hashes (tableau non vide) est requis' });
      return;
    }

    if (!memory_type) {
      res.status(400).json({ error: 'Le champ memory_type est requis' });
      return;
    }

    const now = Date.now() / 1000;
    const nowIso = new Date().toISOString();
    const placeholders = hashes.map(() => '?').join(',');

    const result = db.prepare(`
      UPDATE memories
      SET memory_type = ?, updated_at = ?, updated_at_iso = ?
      WHERE content_hash IN (${placeholders}) AND deleted_at IS NULL
    `).run(memory_type, now, nowIso, ...hashes);

    res.json({ updated: result.changes });
  });

  // GET /api/memories/export - exporter toutes les memoires actives
  router.get('/memories/export', (_req: Request, res: Response) => {
    const rows = db.prepare(
      'SELECT * FROM memories WHERE deleted_at IS NULL ORDER BY created_at DESC'
    ).all() as MemoryRow[];

    const memories = rows.map(parseMemory);
    const now = new Date().toISOString();

    res.setHeader('Content-Disposition', `attachment; filename="memories-export-${now.slice(0, 10)}.json"`);
    res.json({
      memories,
      count: memories.length,
      exportedAt: now,
    });
  });

  // POST /api/memories/import - importer des memoires depuis un JSON
  router.post('/memories/import', (req: Request, res: Response) => {
    const { memories } = req.body;

    if (!memories || !Array.isArray(memories)) {
      res.status(400).json({ error: 'Le champ memories (tableau) est requis' });
      return;
    }

    const insert = db.prepare(`
      INSERT OR IGNORE INTO memories (content_hash, content, tags, memory_type, metadata,
        created_at, updated_at, created_at_iso, updated_at_iso, deleted_at)
      VALUES (@content_hash, @content, @tags, @memory_type, @metadata,
        @created_at, @updated_at, @created_at_iso, @updated_at_iso, NULL)
    `);

    let imported = 0;
    let skipped = 0;

    const importAll = db.transaction(() => {
      for (const mem of memories) {
        if (!mem.content_hash || !mem.content) {
          skipped++;
          continue;
        }

        const tags = Array.isArray(mem.tags) ? mem.tags.join(',') : (mem.tags || null);
        const metadata = mem.metadata ? (typeof mem.metadata === 'string' ? mem.metadata : JSON.stringify(mem.metadata)) : null;
        const now = Date.now() / 1000;
        const nowIso = new Date().toISOString();

        const result = insert.run({
          content_hash: mem.content_hash,
          content: mem.content,
          tags,
          memory_type: mem.memory_type || null,
          metadata,
          created_at: mem.created_at || now,
          updated_at: mem.updated_at || now,
          created_at_iso: mem.created_at_iso || nowIso,
          updated_at_iso: mem.updated_at_iso || nowIso,
        });

        if (result.changes > 0) {
          imported++;
        } else {
          skipped++;
        }
      }
    });

    importAll();
    res.json({ imported, skipped, total: memories.length });
  });

  // GET /api/memories/timeline - memoires groupees par jour
  router.get('/memories/timeline', (req: Request, res: Response) => {
    const typeFilter = (req.query.type as string)?.trim() || '';
    const tagsFilter = (req.query.tags as string)?.trim() || '';

    const whereClauses: string[] = ['deleted_at IS NULL'];
    const whereParams: unknown[] = [];

    if (typeFilter) {
      whereClauses.push('memory_type = ?');
      whereParams.push(typeFilter);
    }

    if (tagsFilter) {
      const tags = tagsFilter.split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        const tagConditions = tags.map(() => 'tags LIKE ?').join(' OR ');
        whereClauses.push(`(${tagConditions})`);
        for (const tag of tags) {
          whereParams.push(`%${tag}%`);
        }
      }
    }

    const whereClause = whereClauses.join(' AND ');

    const rows = db.prepare(`
      SELECT * FROM memories
      WHERE ${whereClause}
      ORDER BY created_at DESC
    `).all(...whereParams) as MemoryRow[];

    // Grouper par date (substr de created_at_iso = YYYY-MM-DD)
    const groupMap = new Map<string, MemoryRow[]>();
    for (const row of rows) {
      const date = row.created_at_iso.substring(0, 10);
      if (!groupMap.has(date)) {
        groupMap.set(date, []);
      }
      groupMap.get(date)!.push(row);
    }

    // Construire la reponse triee par date decroissante
    const groups = Array.from(groupMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, memories]) => ({
        date,
        count: memories.length,
        memories: memories.map(parseMemory),
      }));

    res.json({
      groups,
      total: rows.length,
    });
  });

  // POST /api/memories/:hash/rate - noter la qualite d'une memoire
  // Accepte { score: 0-1 } (valeur directe) ou { rating: 1|-1 } (increment)
  router.post('/memories/:hash/rate', (req: Request, res: Response) => {
    const { hash } = req.params;
    const { rating, score } = req.body;

    // Validation : soit score (0-1), soit rating (1/-1)
    const hasScore = score !== undefined && score !== null;
    const hasRating = rating !== undefined && rating !== null;

    if (!hasScore && !hasRating) {
      res.status(400).json({ error: 'Le champ score (0-1) ou rating (1/-1) est requis' });
      return;
    }

    if (hasScore && (typeof score !== 'number' || score < 0 || score > 1)) {
      res.status(400).json({ error: 'Le champ score doit etre un nombre entre 0 et 1' });
      return;
    }

    if (hasRating && rating !== 1 && rating !== -1) {
      res.status(400).json({ error: 'Le champ rating doit etre 1 ou -1' });
      return;
    }

    const row = db.prepare(
      'SELECT * FROM memories WHERE content_hash = ? AND deleted_at IS NULL'
    ).get(hash) as MemoryRow | undefined;

    if (!row) {
      res.status(404).json({ error: 'Memoire non trouvee' });
      return;
    }

    // Extraire quality_score depuis metadata
    let metadata: Record<string, unknown> = {};
    try {
      if (typeof row.metadata === 'string') {
        metadata = JSON.parse(row.metadata);
      }
    } catch {
      // metadata invalide, initialiser a vide
    }

    let newScore: number;
    if (hasScore) {
      // Score direct (etoiles : 1=0.2, 2=0.4, 3=0.6, 4=0.8, 5=1.0)
      newScore = score;
    } else {
      // Increment +/- 0.1
      const currentScore = typeof metadata.quality_score === 'number' ? metadata.quality_score : 0.5;
      const delta = rating === 1 ? 0.1 : -0.1;
      newScore = Math.min(1, Math.max(0, currentScore + delta));
    }

    // Arrondir pour eviter les erreurs de virgule flottante
    metadata.quality_score = Math.round(newScore * 1e10) / 1e10;

    const now = Date.now() / 1000;
    const nowIso = new Date().toISOString();

    db.prepare(`
      UPDATE memories
      SET metadata = ?, updated_at = ?, updated_at_iso = ?
      WHERE content_hash = ?
    `).run(JSON.stringify(metadata), now, nowIso, hash);

    res.json({
      quality_score: metadata.quality_score,
      content_hash: hash,
    });
  });

  // GET /api/memories/:hash/graph
  router.get('/memories/:hash/graph', (req: Request, res: Response) => {
    const { hash } = req.params;

    const rows = db.prepare(`
      SELECT * FROM memory_graph
      WHERE source_hash = ? OR target_hash = ?
    `).all(hash, hash) as GraphRow[];

    res.json({ data: rows });
  });

  // GET /api/memories/:hash
  router.get('/memories/:hash', (req: Request, res: Response) => {
    const { hash } = req.params;

    const row = db.prepare(
      'SELECT * FROM memories WHERE content_hash = ? AND deleted_at IS NULL'
    ).get(hash) as MemoryRow | undefined;

    if (!row) {
      res.status(404).json({ error: 'Memoire non trouvee' });
      return;
    }

    res.json(parseMemory(row));
  });

  // GET /api/memories
  router.get('/memories', (req: Request, res: Response) => {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 200);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    // Extraction des parametres de filtrage
    const typeFilter = (req.query.type as string)?.trim() || '';
    const tagsFilter = (req.query.tags as string)?.trim() || '';
    const fromFilter = (req.query.from as string)?.trim() || '';
    const toFilter = (req.query.to as string)?.trim() || '';
    const qualityMinFilter = req.query.quality_min ? parseFloat(req.query.quality_min as string) : null;
    const qualityMaxFilter = req.query.quality_max ? parseFloat(req.query.quality_max as string) : null;

    // Construction dynamique de la clause WHERE
    const whereClauses: string[] = ['deleted_at IS NULL'];
    const whereParams: unknown[] = [];

    // Filtre par type
    if (typeFilter) {
      whereClauses.push('memory_type = ?');
      whereParams.push(typeFilter);
    }

    // Filtre par tags (OR logique pour tags multiples)
    if (tagsFilter) {
      const tags = tagsFilter.split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        const tagConditions = tags.map(() => 'tags LIKE ?').join(' OR ');
        whereClauses.push(`(${tagConditions})`);
        for (const tag of tags) {
          whereParams.push(`%${tag}%`);
        }
      }
    }

    // Filtre par date from
    if (fromFilter) {
      const fromTimestamp = new Date(fromFilter).getTime() / 1000;
      if (!isNaN(fromTimestamp)) {
        whereClauses.push('created_at >= ?');
        whereParams.push(fromTimestamp);
      }
    }

    // Filtre par date to
    if (toFilter) {
      const toTimestamp = new Date(toFilter).getTime() / 1000;
      if (!isNaN(toTimestamp)) {
        whereClauses.push('created_at <= ?');
        whereParams.push(toTimestamp);
      }
    }

    // Filtre par quality_min
    if (qualityMinFilter !== null && !isNaN(qualityMinFilter)) {
      whereClauses.push("json_extract(metadata, '$.quality_score') >= ?");
      whereParams.push(qualityMinFilter);
    }

    // Filtre par quality_max
    if (qualityMaxFilter !== null && !isNaN(qualityMaxFilter)) {
      whereClauses.push("json_extract(metadata, '$.quality_score') <= ?");
      whereParams.push(qualityMaxFilter);
    }

    const whereClause = whereClauses.join(' AND ');

    // Comptage total avec filtres
    const totalRow = db.prepare(
      `SELECT COUNT(*) as total FROM memories WHERE ${whereClause}`
    ).get(...whereParams) as { total: number };

    // Selection avec filtres + pagination
    const rows = db.prepare(`
      SELECT * FROM memories
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...whereParams, limit, offset) as MemoryRow[];

    res.json({
      data: rows.map(parseMemory),
      total: totalRow.total,
      limit,
      offset,
    });
  });

  // PUT /api/memories/:hash
  router.put('/memories/:hash', (req: Request, res: Response) => {
    const { hash } = req.params;
    const { tags, memory_type, content } = req.body;

    if (!tags && !memory_type && !content) {
      res.status(400).json({ error: 'Au moins un champ a modifier est requis (tags, memory_type, content)' });
      return;
    }

    const existing = db.prepare(
      'SELECT * FROM memories WHERE content_hash = ? AND deleted_at IS NULL'
    ).get(hash) as MemoryRow | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Memoire non trouvee' });
      return;
    }

    const now = Date.now() / 1000;
    const nowIso = new Date().toISOString();

    const updates: string[] = [];
    const values: unknown[] = [];

    if (tags) {
      const tagStr = Array.isArray(tags) ? tags.join(',') : String(tags);
      updates.push('tags = ?');
      values.push(tagStr);
    }

    if (memory_type) {
      updates.push('memory_type = ?');
      values.push(memory_type);
    }

    if (content) {
      updates.push('content = ?');
      values.push(content);
    }

    updates.push('updated_at = ?', 'updated_at_iso = ?');
    values.push(now, nowIso, hash);

    db.prepare(`UPDATE memories SET ${updates.join(', ')} WHERE content_hash = ?`).run(...values);

    const updated = db.prepare(
      'SELECT * FROM memories WHERE content_hash = ?'
    ).get(hash) as MemoryRow;

    res.json(parseMemory(updated));
  });

  // DELETE /api/memories/:hash (soft delete)
  router.delete('/memories/:hash', (req: Request, res: Response) => {
    const { hash } = req.params;

    const existing = db.prepare(
      'SELECT * FROM memories WHERE content_hash = ? AND deleted_at IS NULL'
    ).get(hash) as MemoryRow | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Memoire non trouvee' });
      return;
    }

    const now = Date.now() / 1000;
    db.prepare('UPDATE memories SET deleted_at = ? WHERE content_hash = ?').run(now, hash);

    res.json({ deleted: true, content_hash: hash });
  });

  // GET /api/graph - graphe complet pour visualisation
  router.get('/graph', (_req: Request, res: Response) => {
    const memories = db.prepare(
      'SELECT content_hash, content, memory_type, tags FROM memories WHERE deleted_at IS NULL'
    ).all() as Pick<MemoryRow, 'content_hash' | 'content' | 'memory_type' | 'tags'>[];

    const edges = db.prepare('SELECT * FROM memory_graph').all() as GraphRow[];

    // Noeuds : seulement les memoires actives
    const activeHashes = new Set(memories.map(m => m.content_hash));
    const nodes = memories.map(m => ({
      id: m.content_hash,
      content: m.content.length > 80 ? m.content.substring(0, 80) + '...' : m.content,
      memory_type: m.memory_type,
      tags: m.tags ? m.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }));

    // Liens : seulement ceux entre memoires actives
    const links = edges
      .filter(e => activeHashes.has(e.source_hash) && activeHashes.has(e.target_hash))
      .map(e => ({
        source: e.source_hash,
        target: e.target_hash,
        similarity: e.similarity,
        relationship_type: e.relationship_type,
      }));

    res.json({ nodes, links });
  });

  // GET /api/tags
  router.get('/tags', (_req: Request, res: Response) => {
    const tagRows = db.prepare(
      'SELECT tags FROM memories WHERE deleted_at IS NULL AND tags IS NOT NULL'
    ).all() as { tags: string }[];

    const tagSet = new Set<string>();
    for (const row of tagRows) {
      const tags = row.tags.split(',').map(t => t.trim()).filter(Boolean);
      for (const tag of tags) {
        tagSet.add(tag);
      }
    }

    res.json({ data: Array.from(tagSet).sort() });
  });

  return router;
}
