import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Database as DatabaseType } from 'better-sqlite3';
import { createTestDb, ACTIVE_MEMORY_COUNT } from './helpers/test-db';
import { createMemoriesRouter } from '../src/routes/memories';
import type { EmbedFn } from '../src/embedder';

// Mock embedder qui retourne un vecteur deterministe base sur le texte
const mockEmbedFn: EmbedFn = async (_text: string) => {
  const vec = new Float32Array(384);
  for (let i = 0; i < 384; i++) {
    vec[i] = Math.sin(i) * 0.1;
  }
  return vec;
};

let db: DatabaseType;
let app: express.Express;

beforeAll(() => {
  db = createTestDb();
  app = express();
  app.use(express.json());
  app.use('/api', createMemoriesRouter(db, { embedFn: mockEmbedFn }));
});

afterAll(() => {
  db.close();
});

// --- GET /api/memories ---
describe('GET /api/memories', () => {
  it('retourne 200 avec une liste de memoires', async () => {
    const res = await request(app).get('/api/memories');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('exclut les memoires supprimees (deleted_at != null)', async () => {
    const res = await request(app).get('/api/memories');
    expect(res.body.data).toHaveLength(ACTIVE_MEMORY_COUNT);
    const hashes = res.body.data.map((m: { content_hash: string }) => m.content_hash);
    expect(hashes).not.toContain('hash_ddd444');
  });

  it('retourne les memoires triees par date decroissante', async () => {
    const res = await request(app).get('/api/memories');
    const dates = res.body.data.map((m: { created_at: number }) => m.created_at);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
    }
  });

  it('supporte la pagination avec limit et offset', async () => {
    const res = await request(app).get('/api/memories?limit=2&offset=0');
    expect(res.body.data).toHaveLength(2);
    expect(res.body).toHaveProperty('total', ACTIVE_MEMORY_COUNT);
    expect(res.body).toHaveProperty('limit', 2);
    expect(res.body).toHaveProperty('offset', 0);
  });

  it('retourne la page suivante avec offset', async () => {
    const page1 = await request(app).get('/api/memories?limit=2&offset=0');
    const page2 = await request(app).get('/api/memories?limit=2&offset=2');
    const hashes1 = page1.body.data.map((m: { content_hash: string }) => m.content_hash);
    const hashes2 = page2.body.data.map((m: { content_hash: string }) => m.content_hash);
    // Pas de chevauchement
    for (const h of hashes2) {
      expect(hashes1).not.toContain(h);
    }
  });

  it('parse le champ metadata en JSON', async () => {
    const res = await request(app).get('/api/memories');
    const withMeta = res.body.data.find(
      (m: { content_hash: string }) => m.content_hash === 'hash_aaa111'
    );
    expect(withMeta.metadata).toBeTypeOf('object');
    expect(withMeta.metadata).toHaveProperty('access_count', 3);
  });

  it('parse le champ tags en tableau', async () => {
    const res = await request(app).get('/api/memories');
    const mem = res.body.data.find(
      (m: { content_hash: string }) => m.content_hash === 'hash_aaa111'
    );
    expect(Array.isArray(mem.tags)).toBe(true);
    expect(mem.tags).toContain('express');
    expect(mem.tags).toContain('typescript');
  });
});

// --- GET /api/memories/:hash ---
describe('GET /api/memories/:hash', () => {
  it('retourne 200 avec le detail de la memoire', async () => {
    const res = await request(app).get('/api/memories/hash_aaa111');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('content_hash', 'hash_aaa111');
    expect(res.body).toHaveProperty('content');
  });

  it('retourne 404 pour un hash inexistant', async () => {
    const res = await request(app).get('/api/memories/hash_inexistant');
    expect(res.status).toBe(404);
  });

  it('retourne 404 pour une memoire supprimee', async () => {
    const res = await request(app).get('/api/memories/hash_ddd444');
    expect(res.status).toBe(404);
  });

  it('parse metadata et tags dans le detail', async () => {
    const res = await request(app).get('/api/memories/hash_bbb222');
    expect(res.body.metadata).toBeTypeOf('object');
    expect(Array.isArray(res.body.tags)).toBe(true);
    expect(res.body.tags).toContain('architecture');
  });
});

// --- GET /api/memories/search ---
describe('GET /api/memories/search', () => {
  it('retourne des resultats pour une recherche valide', async () => {
    const res = await request(app).get('/api/memories/search?q=Express');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('retourne 400 sans parametre q', async () => {
    const res = await request(app).get('/api/memories/search');
    expect(res.status).toBe(400);
  });

  it('ne retourne pas les memoires supprimees', async () => {
    const res = await request(app).get('/api/memories/search?q=supprimee');
    const hashes = res.body.data.map((m: { content_hash: string }) => m.content_hash);
    expect(hashes).not.toContain('hash_ddd444');
  });

  it('retourne un tableau vide pour une recherche sans resultats', async () => {
    const res = await request(app).get('/api/memories/search?q=xyznonexistent123');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

// --- GET /api/memories/stats ---
describe('GET /api/memories/stats', () => {
  it('retourne les statistiques globales', async () => {
    const res = await request(app).get('/api/memories/stats');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total', ACTIVE_MEMORY_COUNT);
  });

  it('retourne la repartition par type', async () => {
    const res = await request(app).get('/api/memories/stats');
    expect(res.body).toHaveProperty('byType');
    expect(res.body.byType).toBeTypeOf('object');
    // On a note, decision, observation dans le seed
    expect(res.body.byType).toHaveProperty('note');
    expect(res.body.byType).toHaveProperty('decision');
    expect(res.body.byType).toHaveProperty('observation');
  });

  it('retourne la liste des tags avec compte', async () => {
    const res = await request(app).get('/api/memories/stats');
    expect(res.body).toHaveProperty('byTag');
    expect(res.body.byTag).toBeTypeOf('object');
  });
});

// --- GET /api/memories/:hash/graph ---
describe('GET /api/memories/:hash/graph', () => {
  it('retourne les associations pour un hash connecte', async () => {
    const res = await request(app).get('/api/memories/hash_aaa111/graph');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('retourne un tableau vide pour un hash sans associations', async () => {
    const res = await request(app).get('/api/memories/hash_eee555/graph');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('retourne les deux directions (source et target)', async () => {
    // hash_bbb222 est target dans 2 associations
    const res = await request(app).get('/api/memories/hash_bbb222/graph');
    expect(res.body.data.length).toBe(2);
  });
});

// --- GET /api/tags ---
describe('GET /api/tags', () => {
  it('retourne la liste des tags uniques', async () => {
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toContain('express');
    expect(res.body.data).toContain('architecture');
    expect(res.body.data).toContain('powershell');
  });

  it('exclut les tags des memoires supprimees', async () => {
    const res = await request(app).get('/api/tags');
    // hash_ddd444 a le tag 'test' et est supprime
    // Mais le tag 'test' n'existe pas dans d'autres memoires actives (seed actuel)
    // Verifier que le tag n'est present que dans les memoires actives
    expect(res.body.data).not.toContain('test');
  });
});

// --- PUT /api/memories/:hash ---
describe('PUT /api/memories/:hash', () => {
  it('modifie les tags d\'une memoire', async () => {
    const res = await request(app)
      .put('/api/memories/hash_aaa111')
      .send({ tags: ['express', 'typescript', 'updated'] });
    expect(res.status).toBe(200);
    expect(res.body.tags).toContain('updated');

    // Verifier la persistance
    const detail = await request(app).get('/api/memories/hash_aaa111');
    expect(detail.body.tags).toContain('updated');
  });

  it('modifie le type de memoire', async () => {
    const res = await request(app)
      .put('/api/memories/hash_aaa111')
      .send({ memory_type: 'decision' });
    expect(res.status).toBe(200);
    expect(res.body.memory_type).toBe('decision');
  });

  it('modifie le contenu', async () => {
    const res = await request(app)
      .put('/api/memories/hash_ccc333')
      .send({ content: 'Contenu modifie pour le test.' });
    expect(res.status).toBe(200);
    expect(res.body.content).toBe('Contenu modifie pour le test.');
  });

  it('met a jour updated_at lors de la modification', async () => {
    const before = await request(app).get('/api/memories/hash_bbb222');
    const beforeUpdated = before.body.updated_at;

    await request(app)
      .put('/api/memories/hash_bbb222')
      .send({ memory_type: 'observation' });

    const after = await request(app).get('/api/memories/hash_bbb222');
    expect(after.body.updated_at).toBeGreaterThanOrEqual(beforeUpdated);
  });

  it('retourne 404 pour un hash inexistant', async () => {
    const res = await request(app)
      .put('/api/memories/hash_inexistant')
      .send({ tags: ['nope'] });
    expect(res.status).toBe(404);
  });

  it('retourne 400 sans body valide', async () => {
    const res = await request(app)
      .put('/api/memories/hash_aaa111')
      .send({});
    expect(res.status).toBe(400);
  });
});

// --- DELETE /api/memories/:hash ---
describe('DELETE /api/memories/:hash', () => {
  it('supprime (soft delete) une memoire existante', async () => {
    const res = await request(app).delete('/api/memories/hash_eee555');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('deleted', true);

    // Verifier que la memoire n'apparait plus dans la liste
    const list = await request(app).get('/api/memories');
    const hashes = list.body.data.map((m: { content_hash: string }) => m.content_hash);
    expect(hashes).not.toContain('hash_eee555');
  });

  it('retourne 404 pour un hash inexistant', async () => {
    const res = await request(app).delete('/api/memories/hash_inexistant');
    expect(res.status).toBe(404);
  });

  it('retourne 404 pour une memoire deja supprimee', async () => {
    const res = await request(app).delete('/api/memories/hash_ddd444');
    expect(res.status).toBe(404);
  });
});

// --- GET /api/graph ---
describe('GET /api/graph', () => {
  it('retourne le graphe complet avec noeuds et liens', async () => {
    const res = await request(app).get('/api/graph');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nodes');
    expect(res.body).toHaveProperty('links');
    expect(Array.isArray(res.body.nodes)).toBe(true);
    expect(Array.isArray(res.body.links)).toBe(true);
  });

  it('les noeuds contiennent les infos de base des memoires', async () => {
    const res = await request(app).get('/api/graph');
    if (res.body.nodes.length > 0) {
      const node = res.body.nodes[0];
      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('content');
      expect(node).toHaveProperty('memory_type');
    }
  });

  it('les liens contiennent similarite et type', async () => {
    const res = await request(app).get('/api/graph');
    if (res.body.links.length > 0) {
      const link = res.body.links[0];
      expect(link).toHaveProperty('source');
      expect(link).toHaveProperty('target');
      expect(link).toHaveProperty('similarity');
    }
  });
});

// --- GET /api/memories/vector-search ---
describe('GET /api/memories/vector-search', () => {
  it('retourne des resultats avec un score de similarite', async () => {
    const res = await request(app).get('/api/memories/vector-search?q=Express+TypeScript');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('similarity');
    expect(res.body.data[0].similarity).toBeTypeOf('number');
  });

  it('retourne 400 sans parametre q', async () => {
    const res = await request(app).get('/api/memories/vector-search');
    expect(res.status).toBe(400);
  });

  it('respecte le parametre limit', async () => {
    const res = await request(app).get('/api/memories/vector-search?q=test&limit=2');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
  });

  it('exclut les memoires supprimees', async () => {
    const res = await request(app).get('/api/memories/vector-search?q=test&limit=50');
    const hashes = res.body.data.map((m: { content_hash: string }) => m.content_hash);
    expect(hashes).not.toContain('hash_ddd444');
  });

  it('trie par similarite decroissante', async () => {
    const res = await request(app).get('/api/memories/vector-search?q=test');
    const scores = res.body.data.map((m: { similarity: number }) => m.similarity);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });
});

// --- GET /api/memories/export ---
describe('GET /api/memories/export', () => {
  it('exporte toutes les memoires actives en JSON', async () => {
    const res = await request(app).get('/api/memories/export');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toHaveProperty('memories');
    expect(Array.isArray(res.body.memories)).toBe(true);
    expect(res.body.memories.length).toBeGreaterThan(0);
  });

  it('contient les champs essentiels pour chaque memoire', async () => {
    const res = await request(app).get('/api/memories/export');
    const mem = res.body.memories[0];
    expect(mem).toHaveProperty('content_hash');
    expect(mem).toHaveProperty('content');
    expect(mem).toHaveProperty('tags');
    expect(mem).toHaveProperty('memory_type');
  });

  it('exclut les memoires supprimees', async () => {
    const res = await request(app).get('/api/memories/export');
    const hashes = res.body.memories.map((m: { content_hash: string }) => m.content_hash);
    expect(hashes).not.toContain('hash_ddd444');
  });

  it('inclut un header Content-Disposition pour le telechargement', async () => {
    const res = await request(app).get('/api/memories/export');
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    expect(res.headers['content-disposition']).toMatch(/memories-export.*\.json/);
  });

  it('inclut les metadonnees d\'export', async () => {
    const res = await request(app).get('/api/memories/export');
    expect(res.body).toHaveProperty('exportedAt');
    expect(res.body).toHaveProperty('count');
    expect(res.body.count).toBe(res.body.memories.length);
  });
});

// --- POST /api/memories/import ---
describe('POST /api/memories/import', () => {
  it('importe des memoires a partir de JSON', async () => {
    const importData = {
      memories: [
        {
          content_hash: 'hash_import_001',
          content: 'Memoire importee pour test.',
          tags: ['import', 'test'],
          memory_type: 'note',
          metadata: { source: 'import' },
          created_at: 1771090000,
          updated_at: 1771090000,
          created_at_iso: '2026-02-14T18:00:00.000Z',
          updated_at_iso: '2026-02-14T18:00:00.000Z',
        },
      ],
    };

    const res = await request(app).post('/api/memories/import').send(importData);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('imported');
    expect(res.body.imported).toBe(1);
  });

  it('la memoire importee est accessible via GET', async () => {
    const res = await request(app).get('/api/memories/hash_import_001');
    expect(res.status).toBe(200);
    expect(res.body.content).toBe('Memoire importee pour test.');
  });

  it('ignore les doublons (content_hash existant)', async () => {
    const importData = {
      memories: [
        {
          content_hash: 'hash_aaa111',
          content: 'Tentative de doublon.',
          tags: ['doublon'],
          memory_type: 'note',
          metadata: null,
          created_at: 1771090000,
          updated_at: 1771090000,
          created_at_iso: '2026-02-14T18:00:00.000Z',
          updated_at_iso: '2026-02-14T18:00:00.000Z',
        },
      ],
    };

    const res = await request(app).post('/api/memories/import').send(importData);
    expect(res.status).toBe(200);
    expect(res.body.imported).toBe(0);
    expect(res.body.skipped).toBe(1);
  });

  it('retourne 400 sans champ memories', async () => {
    const res = await request(app).post('/api/memories/import').send({ data: [] });
    expect(res.status).toBe(400);
  });

  it('retourne 400 si memories n\'est pas un tableau', async () => {
    const res = await request(app).post('/api/memories/import').send({ memories: 'invalid' });
    expect(res.status).toBe(400);
  });
});
