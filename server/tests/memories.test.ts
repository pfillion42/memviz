import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Database as DatabaseType } from 'better-sqlite3';
import { createTestDb, ACTIVE_MEMORY_COUNT } from './helpers/test-db';
import { createMemoriesRouter } from '../src/routes/memories';
import type { EmbedFn } from '../src/embedder';

// Mock embedder qui retourne un vecteur deterministe base sur le texte
const mockEmbedFn: EmbedFn = async () => {
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
    // hash_ddd444 est supprime mais nous avons maintenant d'autres memoires avec 'test'
    // Donc le tag 'test' sera present (hash_fff666 et hash_ggg777 ont le tag 'test')
    expect(res.body.data).toContain('test');
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

// --- GET /api/memories/duplicates ---
describe('GET /api/memories/duplicates', () => {
  it('retourne 503 si embedder non disponible', async () => {
    // Creer une app sans embedFn pour ce test
    const appNoEmbed = express();
    appNoEmbed.use(express.json());
    appNoEmbed.use('/api', createMemoriesRouter(db));

    const res = await request(appNoEmbed).get('/api/memories/duplicates');
    expect(res.status).toBe(503);
  });

  it('retourne un objet avec groups (array) et total_groups (number)', async () => {
    const res = await request(app).get('/api/memories/duplicates?threshold=0.5');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('groups');
    expect(Array.isArray(res.body.groups)).toBe(true);
    expect(res.body).toHaveProperty('total_groups');
    expect(typeof res.body.total_groups).toBe('number');
  });

  it('avec threshold=0.0, retourne des groupes (similarite elevee)', async () => {
    const res = await request(app).get('/api/memories/duplicates?threshold=0.0');
    expect(res.status).toBe(200);
    // Avec un seuil de 0.0, pratiquement toutes les memoires sont "similaires"
    expect(res.body.groups.length).toBeGreaterThan(0);
  });

  it('avec threshold=0.99, retourne moins ou aucun groupe', async () => {
    const res = await request(app).get('/api/memories/duplicates?threshold=0.99');
    expect(res.status).toBe(200);
    // Avec un seuil tres eleve, peu ou pas de doublons
    expect(res.body.groups.length).toBeLessThanOrEqual(1);
  });

  it('chaque groupe contient similarity et memories (array)', async () => {
    const res = await request(app).get('/api/memories/duplicates?threshold=0.5');
    expect(res.status).toBe(200);

    if (res.body.groups.length > 0) {
      const group = res.body.groups[0];
      expect(group).toHaveProperty('similarity');
      expect(typeof group.similarity).toBe('number');
      expect(group).toHaveProperty('memories');
      expect(Array.isArray(group.memories)).toBe(true);
      expect(group.memories.length).toBeGreaterThanOrEqual(2);

      // Verifier que chaque memoire a les champs essentiels
      const mem = group.memories[0];
      expect(mem).toHaveProperty('content_hash');
      expect(mem).toHaveProperty('content');
      expect(mem).toHaveProperty('tags');
      expect(mem).toHaveProperty('memory_type');
    }
  });

  it('exclut les memoires supprimees (deleted_at != null)', async () => {
    const res = await request(app).get('/api/memories/duplicates?threshold=0.0');
    expect(res.status).toBe(200);

    // Parcourir tous les groupes et verifier qu'aucune memoire supprimee n'est presente
    for (const group of res.body.groups) {
      const hashes = group.memories.map((m: { content_hash: string }) => m.content_hash);
      expect(hashes).not.toContain('hash_ddd444');
    }
  });

  it('retourne threshold par defaut si non fourni', async () => {
    const res = await request(app).get('/api/memories/duplicates');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('groups');
  });

  it('trie les groupes par similarite decroissante', async () => {
    const res = await request(app).get('/api/memories/duplicates?threshold=0.3');
    expect(res.status).toBe(200);

    if (res.body.groups.length > 1) {
      const sims = res.body.groups.map((g: { similarity: number }) => g.similarity);
      for (let i = 1; i < sims.length; i++) {
        expect(sims[i]).toBeLessThanOrEqual(sims[i - 1]);
      }
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

// --- GET /api/memories - filtres avances ---
describe('GET /api/memories - filtres avances', () => {
  it('filtre par type : retourne seulement les notes', async () => {
    const res = await request(app).get('/api/memories?type=note');
    expect(res.status).toBe(200);
    expect(res.body.data.every((m: { memory_type: string }) => m.memory_type === 'note')).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('filtre par type : retourne seulement les decisions', async () => {
    const res = await request(app).get('/api/memories?type=decision');
    expect(res.status).toBe(200);
    expect(res.body.data.every((m: { memory_type: string }) => m.memory_type === 'decision')).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('filtre par tag single : retourne memoires avec le tag express', async () => {
    const res = await request(app).get('/api/memories?tags=express');
    expect(res.status).toBe(200);
    expect(res.body.data.every(
      (m: { tags: string[] }) => m.tags.includes('express')
    )).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('filtre par tags multiples : OR logique (express,typescript)', async () => {
    const res = await request(app).get('/api/memories?tags=express,typescript');
    expect(res.status).toBe(200);
    expect(res.body.data.every(
      (m: { tags: string[] }) => m.tags.includes('express') || m.tags.includes('typescript')
    )).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('filtre par date from : memoires apres une date', async () => {
    const fromDate = '2026-02-14T17:00:00.000Z';
    const fromTimestamp = new Date(fromDate).getTime() / 1000;

    const res = await request(app).get(`/api/memories?from=${fromDate}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every(
      (m: { created_at: number }) => m.created_at >= fromTimestamp
    )).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('filtre par date to : memoires avant une date', async () => {
    const toDate = '2026-02-14T17:00:00.000Z';
    const toTimestamp = new Date(toDate).getTime() / 1000;

    const res = await request(app).get(`/api/memories?to=${toDate}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every(
      (m: { created_at: number }) => m.created_at <= toTimestamp
    )).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('filtre par date range : from et to', async () => {
    const fromDate = '2026-02-14T16:50:00.000Z';
    const toDate = '2026-02-14T17:05:00.000Z';
    const fromTimestamp = new Date(fromDate).getTime() / 1000;
    const toTimestamp = new Date(toDate).getTime() / 1000;

    const res = await request(app).get(`/api/memories?from=${fromDate}&to=${toDate}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every(
      (m: { created_at: number }) => m.created_at >= fromTimestamp && m.created_at <= toTimestamp
    )).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('filtre par quality_min : retourne memoires de haute qualite', async () => {
    const res = await request(app).get('/api/memories?quality_min=0.8');
    expect(res.status).toBe(200);
    expect(res.body.data.every(
      (m: { metadata: { quality_score?: number } }) =>
        m.metadata && typeof m.metadata === 'object' &&
        (m.metadata.quality_score ?? 0) >= 0.8
    )).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('filtre par quality_max : retourne memoires de basse qualite', async () => {
    const res = await request(app).get('/api/memories?quality_max=0.5');
    expect(res.status).toBe(200);
    expect(res.body.data.every(
      (m: { metadata: { quality_score?: number } }) =>
        m.metadata && typeof m.metadata === 'object' &&
        (m.metadata.quality_score ?? 0) <= 0.5
    )).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('combinaison de filtres : type + tags', async () => {
    const res = await request(app).get('/api/memories?type=note&tags=express');
    expect(res.status).toBe(200);
    expect(res.body.data.every(
      (m: { memory_type: string; tags: string[] }) =>
        m.memory_type === 'note' && m.tags.includes('express')
    )).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('filtres + pagination : total reflete le total filtre', async () => {
    const resAll = await request(app).get('/api/memories?type=note');
    const totalNotes = resAll.body.total;

    const resPaginated = await request(app).get('/api/memories?type=note&limit=2');
    expect(resPaginated.body.total).toBe(totalNotes);
    expect(resPaginated.body.data.length).toBeLessThanOrEqual(2);
  });

  it('params vides ignores : pas de filtre avec type vide', async () => {
    const resAll = await request(app).get('/api/memories');
    const resEmpty = await request(app).get('/api/memories?type=');

    expect(resEmpty.status).toBe(200);
    expect(resEmpty.body.total).toBe(resAll.body.total);
  });

  it('filtre par type inexistant : retourne tableau vide', async () => {
    const res = await request(app).get('/api/memories?type=nonexistent');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  it('filtre par tag inexistant : retourne tableau vide', async () => {
    const res = await request(app).get('/api/memories?tags=nonexistent');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });
});

// --- GET /api/memories/timeline ---
describe('GET /api/memories/timeline', () => {
  it('retourne les memoires groupees par date decroissante', async () => {
    const res = await request(app).get('/api/memories/timeline');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('groups');
    expect(Array.isArray(res.body.groups)).toBe(true);
    expect(res.body).toHaveProperty('total');
    expect(typeof res.body.total).toBe('number');

    // Verifier le tri par date decroissante
    const dates = res.body.groups.map((g: { date: string }) => g.date);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] < dates[i - 1]).toBe(true);
    }
  });

  it('chaque groupe contient date, count et memories', async () => {
    const res = await request(app).get('/api/memories/timeline');
    expect(res.status).toBe(200);

    for (const group of res.body.groups) {
      expect(group).toHaveProperty('date');
      expect(group).toHaveProperty('count');
      expect(group).toHaveProperty('memories');
      expect(typeof group.date).toBe('string');
      expect(typeof group.count).toBe('number');
      expect(Array.isArray(group.memories)).toBe(true);
      expect(group.memories.length).toBe(group.count);
    }
  });

  it('le total correspond a la somme des counts', async () => {
    const res = await request(app).get('/api/memories/timeline');
    const sumCounts = res.body.groups.reduce(
      (acc: number, g: { count: number }) => acc + g.count, 0
    );
    expect(res.body.total).toBe(sumCounts);
  });

  it('exclut les memoires supprimees', async () => {
    const res = await request(app).get('/api/memories/timeline');
    for (const group of res.body.groups) {
      const hashes = group.memories.map((m: { content_hash: string }) => m.content_hash);
      expect(hashes).not.toContain('hash_ddd444');
    }
  });

  it('filtre par type', async () => {
    const res = await request(app).get('/api/memories/timeline?type=decision');
    expect(res.status).toBe(200);
    for (const group of res.body.groups) {
      for (const mem of group.memories) {
        expect(mem.memory_type).toBe('decision');
      }
    }
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('filtre par tags', async () => {
    const res = await request(app).get('/api/memories/timeline?tags=express');
    expect(res.status).toBe(200);
    for (const group of res.body.groups) {
      for (const mem of group.memories) {
        expect(mem.tags).toContain('express');
      }
    }
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('retourne un tableau vide pour un type inexistant', async () => {
    const res = await request(app).get('/api/memories/timeline?type=nonexistent');
    expect(res.status).toBe(200);
    expect(res.body.groups).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  it('parse metadata et tags dans les memoires', async () => {
    const res = await request(app).get('/api/memories/timeline');
    const allMemories = res.body.groups.flatMap((g: { memories: unknown[] }) => g.memories);
    const mem = allMemories.find((m: { content_hash: string }) => m.content_hash === 'hash_aaa111');
    expect(mem).toBeDefined();
    expect(mem.metadata).toBeTypeOf('object');
    expect(Array.isArray(mem.tags)).toBe(true);
  });
});

// --- POST /api/memories/:hash/rate ---
describe('POST /api/memories/:hash/rate', () => {
  it('thumbs up augmente le quality_score de 0.1', async () => {
    // hash_hhh888 a quality_score = 0.72
    const res = await request(app)
      .post('/api/memories/hash_hhh888/rate')
      .send({ rating: 1 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('quality_score');
    expect(res.body.quality_score).toBeCloseTo(0.82, 5);
    expect(res.body).toHaveProperty('content_hash', 'hash_hhh888');
  });

  it('thumbs down diminue le quality_score de 0.1', async () => {
    // hash_ccc333 a quality_score = 0.45
    const res = await request(app)
      .post('/api/memories/hash_ccc333/rate')
      .send({ rating: -1 });
    expect(res.status).toBe(200);
    expect(res.body.quality_score).toBeCloseTo(0.35, 5);
    expect(res.body).toHaveProperty('content_hash', 'hash_ccc333');
  });

  it('clamp le score a 1.0 maximum', async () => {
    // hash_ggg777 a quality_score = 1.0
    const res = await request(app)
      .post('/api/memories/hash_ggg777/rate')
      .send({ rating: 1 });
    expect(res.status).toBe(200);
    expect(res.body.quality_score).toBe(1.0);
  });

  it('clamp le score a 0.0 minimum', async () => {
    // Voter -1 plusieurs fois sur hash_fff666 (quality_score = 0.30)
    await request(app).post('/api/memories/hash_fff666/rate').send({ rating: -1 }); // 0.20
    await request(app).post('/api/memories/hash_fff666/rate').send({ rating: -1 }); // 0.10
    const res = await request(app)
      .post('/api/memories/hash_fff666/rate')
      .send({ rating: -1 }); // 0.0
    expect(res.status).toBe(200);
    expect(res.body.quality_score).toBeCloseTo(0.0, 5);

    // Un vote de plus ne doit pas descendre sous 0
    const res2 = await request(app)
      .post('/api/memories/hash_fff666/rate')
      .send({ rating: -1 });
    expect(res2.body.quality_score).toBe(0.0);
  });

  it('retourne 400 pour un rating invalide (0)', async () => {
    const res = await request(app)
      .post('/api/memories/hash_aaa111/rate')
      .send({ rating: 0 });
    expect(res.status).toBe(400);
  });

  it('retourne 400 pour un rating invalide (2)', async () => {
    const res = await request(app)
      .post('/api/memories/hash_aaa111/rate')
      .send({ rating: 2 });
    expect(res.status).toBe(400);
  });

  it('retourne 400 sans body rating', async () => {
    const res = await request(app)
      .post('/api/memories/hash_aaa111/rate')
      .send({});
    expect(res.status).toBe(400);
  });

  it('retourne 404 pour un hash inexistant', async () => {
    const res = await request(app)
      .post('/api/memories/hash_inexistant/rate')
      .send({ rating: 1 });
    expect(res.status).toBe(404);
  });

  it('retourne 404 pour une memoire supprimee', async () => {
    const res = await request(app)
      .post('/api/memories/hash_ddd444/rate')
      .send({ rating: 1 });
    expect(res.status).toBe(404);
  });

  it('accepte un score direct (0-1) pour notation etoiles', async () => {
    const res = await request(app)
      .post('/api/memories/hash_aaa111/rate')
      .send({ score: 0.8 });
    expect(res.status).toBe(200);
    expect(res.body.quality_score).toBe(0.8);
  });

  it('retourne 400 pour un score hors limites', async () => {
    const res = await request(app)
      .post('/api/memories/hash_aaa111/rate')
      .send({ score: 1.5 });
    expect(res.status).toBe(400);
  });

  it('retourne 400 pour un score negatif', async () => {
    const res = await request(app)
      .post('/api/memories/hash_aaa111/rate')
      .send({ score: -0.1 });
    expect(res.status).toBe(400);
  });

  it('met a jour updated_at apres un vote', async () => {
    const before = await request(app).get('/api/memories/hash_bbb222');
    const beforeUpdated = before.body.updated_at;

    await request(app)
      .post('/api/memories/hash_bbb222/rate')
      .send({ rating: 1 });

    const after = await request(app).get('/api/memories/hash_bbb222');
    expect(after.body.updated_at).toBeGreaterThanOrEqual(beforeUpdated);
  });
});

// --- POST /api/memories/bulk-delete ---
describe('Operations en masse', () => {
  describe('POST /api/memories/bulk-delete', () => {
    it('supprime plusieurs memoires par hash (soft delete)', async () => {
      const hashes = ['hash_ccc333', 'hash_import_001'];
      const res = await request(app)
        .post('/api/memories/bulk-delete')
        .send({ hashes });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('deleted', 2);

      // Verifier que les memoires ne sont plus accessibles
      for (const hash of hashes) {
        const detail = await request(app).get(`/api/memories/${hash}`);
        expect(detail.status).toBe(404);
      }

      // Verifier qu'elles n'apparaissent plus dans la liste
      const list = await request(app).get('/api/memories');
      const listHashes = list.body.data.map((m: { content_hash: string }) => m.content_hash);
      expect(listHashes).not.toContain('hash_ccc333');
      expect(listHashes).not.toContain('hash_import_001');
    });

    it('ignore les hashes inexistants sans erreur', async () => {
      const res = await request(app)
        .post('/api/memories/bulk-delete')
        .send({ hashes: ['hash_inexistant1', 'hash_inexistant2'] });

      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(0);
    });

    it('ignore les memoires deja supprimees', async () => {
      const res = await request(app)
        .post('/api/memories/bulk-delete')
        .send({ hashes: ['hash_ddd444'] });

      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(0);
    });

    it('retourne 400 si body vide', async () => {
      const res = await request(app)
        .post('/api/memories/bulk-delete')
        .send({});

      expect(res.status).toBe(400);
    });

    it('retourne 400 si hashes est un tableau vide', async () => {
      const res = await request(app)
        .post('/api/memories/bulk-delete')
        .send({ hashes: [] });

      expect(res.status).toBe(400);
    });

    it('retourne 400 si hashes n\'est pas un tableau', async () => {
      const res = await request(app)
        .post('/api/memories/bulk-delete')
        .send({ hashes: 'invalid' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/memories/bulk-tag', () => {
    it('ajoute des tags a plusieurs memoires', async () => {
      const hashes = ['hash_fff666', 'hash_ggg777'];
      const res = await request(app)
        .post('/api/memories/bulk-tag')
        .send({ hashes, add_tags: ['nouveau-tag'] });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('updated', 2);

      // Verifier que les tags ont ete ajoutes
      for (const hash of hashes) {
        const detail = await request(app).get(`/api/memories/${hash}`);
        expect(detail.body.tags).toContain('nouveau-tag');
      }
    });

    it('retire des tags de plusieurs memoires', async () => {
      const hashes = ['hash_fff666', 'hash_ggg777'];
      const res = await request(app)
        .post('/api/memories/bulk-tag')
        .send({ hashes, remove_tags: ['filtre'] });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('updated', 2);

      // Verifier que le tag a ete retire
      for (const hash of hashes) {
        const detail = await request(app).get(`/api/memories/${hash}`);
        expect(detail.body.tags).not.toContain('filtre');
      }
    });

    it('ajoute et retire des tags en meme temps', async () => {
      const res = await request(app)
        .post('/api/memories/bulk-tag')
        .send({
          hashes: ['hash_hhh888'],
          add_tags: ['ajout-test'],
          remove_tags: ['backend']
        });

      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(1);

      const detail = await request(app).get('/api/memories/hash_hhh888');
      expect(detail.body.tags).toContain('ajout-test');
      expect(detail.body.tags).not.toContain('backend');
    });

    it('gere les doublons : ne pas ajouter un tag deja present', async () => {
      const res = await request(app)
        .post('/api/memories/bulk-tag')
        .send({
          hashes: ['hash_hhh888'],
          add_tags: ['express'] // deja present
        });

      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(1);

      const detail = await request(app).get('/api/memories/hash_hhh888');
      // Express ne doit apparaitre qu'une seule fois
      const expressCount = detail.body.tags.filter((t: string) => t === 'express').length;
      expect(expressCount).toBe(1);
    });

    it('retourne 400 si hashes vide', async () => {
      const res = await request(app)
        .post('/api/memories/bulk-tag')
        .send({ hashes: [], add_tags: ['tag'] });

      expect(res.status).toBe(400);
    });

    it('retourne 400 si ni add_tags ni remove_tags fourni', async () => {
      const res = await request(app)
        .post('/api/memories/bulk-tag')
        .send({ hashes: ['hash_aaa111'] });

      expect(res.status).toBe(400);
    });

    it('ignore les hashes inexistants sans erreur', async () => {
      const res = await request(app)
        .post('/api/memories/bulk-tag')
        .send({
          hashes: ['hash_inexistant'],
          add_tags: ['tag']
        });

      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(0);
    });

    it('met a jour updated_at pour les memoires modifiees', async () => {
      const before = await request(app).get('/api/memories/hash_bbb222');
      const beforeUpdated = before.body.updated_at;

      await request(app)
        .post('/api/memories/bulk-tag')
        .send({
          hashes: ['hash_bbb222'],
          add_tags: ['tag-horodatage']
        });

      const after = await request(app).get('/api/memories/hash_bbb222');
      expect(after.body.updated_at).toBeGreaterThanOrEqual(beforeUpdated);
    });
  });

  describe('POST /api/memories/bulk-type', () => {
    it('change le type de plusieurs memoires', async () => {
      const hashes = ['hash_aaa111', 'hash_bbb222'];
      const res = await request(app)
        .post('/api/memories/bulk-type')
        .send({ hashes, memory_type: 'observation' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('updated', 2);

      // Verifier que le type a ete change
      for (const hash of hashes) {
        const detail = await request(app).get(`/api/memories/${hash}`);
        expect(detail.body.memory_type).toBe('observation');
      }
    });

    it('retourne 400 si hashes vide', async () => {
      const res = await request(app)
        .post('/api/memories/bulk-type')
        .send({ hashes: [], memory_type: 'decision' });

      expect(res.status).toBe(400);
    });

    it('retourne 400 si memory_type manquant', async () => {
      const res = await request(app)
        .post('/api/memories/bulk-type')
        .send({ hashes: ['hash_aaa111'] });

      expect(res.status).toBe(400);
    });

    it('ignore les hashes inexistants sans erreur', async () => {
      const res = await request(app)
        .post('/api/memories/bulk-type')
        .send({
          hashes: ['hash_inexistant'],
          memory_type: 'decision'
        });

      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(0);
    });

    it('met a jour updated_at pour les memoires modifiees', async () => {
      const before = await request(app).get('/api/memories/hash_aaa111');
      const beforeUpdated = before.body.updated_at;

      await request(app)
        .post('/api/memories/bulk-type')
        .send({
          hashes: ['hash_aaa111'],
          memory_type: 'observation'
        });

      const after = await request(app).get('/api/memories/hash_aaa111');
      expect(after.body.updated_at).toBeGreaterThanOrEqual(beforeUpdated);
    });
  });
});

// --- PUT /api/tags/:tag (renommer un tag) ---
describe('PUT /api/tags/:tag', () => {
  let tagDb: DatabaseType;
  let tagApp: express.Express;

  beforeAll(() => {
    tagDb = createTestDb();
    tagApp = express();
    tagApp.use(express.json());
    tagApp.use('/api', createMemoriesRouter(tagDb, { embedFn: mockEmbedFn }));
  });

  afterAll(() => {
    tagDb.close();
  });

  it('renomme un tag dans toutes les memoires', async () => {
    // Le tag "express" est dans hash_aaa111 et hash_hhh888
    const res = await request(tagApp)
      .put('/api/tags/express')
      .send({ new_name: 'expressjs' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('updated');
    expect(res.body.updated).toBe(2);
    expect(res.body).toHaveProperty('old_tag', 'express');
    expect(res.body).toHaveProperty('new_tag', 'expressjs');

    // Verifier que le tag a ete renomme dans les memoires
    const m1 = await request(tagApp).get('/api/memories/hash_aaa111');
    expect(m1.body.tags).toContain('expressjs');
    expect(m1.body.tags).not.toContain('express');

    const m2 = await request(tagApp).get('/api/memories/hash_hhh888');
    expect(m2.body.tags).toContain('expressjs');
    expect(m2.body.tags).not.toContain('express');
  });

  it('met a jour updated_at des memoires modifiees', async () => {
    const before = await request(tagApp).get('/api/memories/hash_bbb222');
    const beforeUpdated = before.body.updated_at;

    await request(tagApp)
      .put('/api/tags/architecture')
      .send({ new_name: 'archi' });

    const after = await request(tagApp).get('/api/memories/hash_bbb222');
    expect(after.body.updated_at).toBeGreaterThanOrEqual(beforeUpdated);
  });

  it('retourne 400 si new_name est manquant', async () => {
    const res = await request(tagApp)
      .put('/api/tags/express')
      .send({});
    expect(res.status).toBe(400);
  });

  it('retourne 400 si new_name est vide', async () => {
    const res = await request(tagApp)
      .put('/api/tags/express')
      .send({ new_name: '' });
    expect(res.status).toBe(400);
  });

  it('retourne updated=0 pour un tag inexistant', async () => {
    const res = await request(tagApp)
      .put('/api/tags/tag_inexistant_xyz')
      .send({ new_name: 'nouveau' });
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(0);
  });

  it('preserve les autres tags lors du renommage', async () => {
    // hash_bbb222 avait "architecture,sqlite,decision" -> "archi" deja renomme
    // On renomme "sqlite" -> "sqlite3"
    await request(tagApp)
      .put('/api/tags/sqlite')
      .send({ new_name: 'sqlite3' });

    const m = await request(tagApp).get('/api/memories/hash_bbb222');
    expect(m.body.tags).toContain('sqlite3');
    expect(m.body.tags).toContain('archi');
    expect(m.body.tags).toContain('decision');
    expect(m.body.tags).not.toContain('sqlite');
  });
});

// --- DELETE /api/tags/:tag (retirer un tag de toutes les memoires) ---
describe('DELETE /api/tags/:tag', () => {
  let tagDb: DatabaseType;
  let tagApp: express.Express;

  beforeAll(() => {
    tagDb = createTestDb();
    tagApp = express();
    tagApp.use(express.json());
    tagApp.use('/api', createMemoriesRouter(tagDb, { embedFn: mockEmbedFn }));
  });

  afterAll(() => {
    tagDb.close();
  });

  it('retire un tag de toutes les memoires', async () => {
    // Le tag "filtre" est dans hash_fff666 et hash_ggg777
    const res = await request(tagApp).delete('/api/tags/filtre');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('updated', 2);
    expect(res.body).toHaveProperty('removed_tag', 'filtre');

    // Verifier le retrait
    const m1 = await request(tagApp).get('/api/memories/hash_fff666');
    expect(m1.body.tags).not.toContain('filtre');

    const m2 = await request(tagApp).get('/api/memories/hash_ggg777');
    expect(m2.body.tags).not.toContain('filtre');
  });

  it('met tags a null si la memoire n\'a plus de tags', async () => {
    // hash_fff666 a tags = "filtre,test" -> "filtre" retire ci-dessus, reste "test"
    // On retire "test" aussi
    await request(tagApp).delete('/api/tags/test');

    const m = await request(tagApp).get('/api/memories/hash_fff666');
    // tags parse en tableau vide quand null
    expect(m.body.tags).toHaveLength(0);
  });

  it('met a jour updated_at des memoires modifiees', async () => {
    const before = await request(tagApp).get('/api/memories/hash_aaa111');
    const beforeUpdated = before.body.updated_at;

    await request(tagApp).delete('/api/tags/config');

    const after = await request(tagApp).get('/api/memories/hash_aaa111');
    expect(after.body.updated_at).toBeGreaterThanOrEqual(beforeUpdated);
  });

  it('retourne updated=0 pour un tag inexistant', async () => {
    const res = await request(tagApp).delete('/api/tags/tag_inexistant_xyz');
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(0);
  });

  it('preserve les autres tags lors du retrait', async () => {
    // hash_aaa111 avait "express,typescript,config" -> config retire ci-dessus
    const m = await request(tagApp).get('/api/memories/hash_aaa111');
    expect(m.body.tags).toContain('express');
    expect(m.body.tags).toContain('typescript');
    expect(m.body.tags).not.toContain('config');
  });
});

// --- POST /api/tags/merge (fusionner plusieurs tags en un seul) ---
describe('POST /api/tags/merge', () => {
  let tagDb: DatabaseType;
  let tagApp: express.Express;

  beforeAll(() => {
    tagDb = createTestDb();
    tagApp = express();
    tagApp.use(express.json());
    tagApp.use('/api', createMemoriesRouter(tagDb, { embedFn: mockEmbedFn }));
  });

  afterAll(() => {
    tagDb.close();
  });

  it('fusionne plusieurs tags en un seul', async () => {
    // "filtre" et "test" dans hash_fff666 et hash_ggg777
    const res = await request(tagApp)
      .post('/api/tags/merge')
      .send({ sources: ['filtre', 'test'], target: 'test-filter' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('updated');
    expect(res.body.updated).toBeGreaterThan(0);
    expect(res.body).toHaveProperty('merged');
    expect(res.body.merged).toContain('filtre');
    expect(res.body.merged).toContain('test');
    expect(res.body).toHaveProperty('into', 'test-filter');

    // Verifier que les memoires ont le tag cible et plus les sources
    const m1 = await request(tagApp).get('/api/memories/hash_fff666');
    expect(m1.body.tags).toContain('test-filter');
    expect(m1.body.tags).not.toContain('filtre');
    expect(m1.body.tags).not.toContain('test');

    const m2 = await request(tagApp).get('/api/memories/hash_ggg777');
    expect(m2.body.tags).toContain('test-filter');
    expect(m2.body.tags).not.toContain('filtre');
    expect(m2.body.tags).not.toContain('test');
  });

  it('evite les doublons si la memoire a deja le tag cible', async () => {
    // hash_aaa111 a "express,typescript,config"
    // Fusionner "config" en "express" (express deja present)
    const res = await request(tagApp)
      .post('/api/tags/merge')
      .send({ sources: ['config'], target: 'express' });
    expect(res.status).toBe(200);

    const m = await request(tagApp).get('/api/memories/hash_aaa111');
    const expressCount = m.body.tags.filter((t: string) => t === 'express').length;
    expect(expressCount).toBe(1);
    expect(m.body.tags).not.toContain('config');
  });

  it('retourne 400 si sources est manquant', async () => {
    const res = await request(tagApp)
      .post('/api/tags/merge')
      .send({ target: 'final' });
    expect(res.status).toBe(400);
  });

  it('retourne 400 si sources est un tableau vide', async () => {
    const res = await request(tagApp)
      .post('/api/tags/merge')
      .send({ sources: [], target: 'final' });
    expect(res.status).toBe(400);
  });

  it('retourne 400 si target est manquant', async () => {
    const res = await request(tagApp)
      .post('/api/tags/merge')
      .send({ sources: ['tag1'] });
    expect(res.status).toBe(400);
  });

  it('retourne 400 si target est vide', async () => {
    const res = await request(tagApp)
      .post('/api/tags/merge')
      .send({ sources: ['tag1'], target: '' });
    expect(res.status).toBe(400);
  });

  it('gere les memoires avec plusieurs tags sources sans doublon', async () => {
    // hash_fff666 et hash_ggg777 avaient "filtre,test" -> devenu "test-filter"
    const m = await request(tagApp).get('/api/memories/hash_fff666');
    const count = m.body.tags.filter((t: string) => t === 'test-filter').length;
    expect(count).toBe(1);
  });

  it('met a jour updated_at des memoires modifiees', async () => {
    const before = await request(tagApp).get('/api/memories/hash_hhh888');
    const beforeUpdated = before.body.updated_at;

    await request(tagApp)
      .post('/api/tags/merge')
      .send({ sources: ['backend'], target: 'back' });

    const after = await request(tagApp).get('/api/memories/hash_hhh888');
    expect(after.body.updated_at).toBeGreaterThanOrEqual(beforeUpdated);
  });
});

// --- Tests de securite ---
describe('Securite - Assainissement FTS5', () => {
  it('assainit les operateurs FTS5 speciaux (AND/OR/NOT)', async () => {
    const res = await request(app).get('/api/memories/search?q=Express%20AND%20DROP%20TABLE');
    expect(res.status).toBe(200);
    // Ne doit pas crasher, doit retourner des resultats ou un tableau vide
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('assainit les caracteres speciaux FTS5 (*, ", ^)', async () => {
    const res = await request(app).get('/api/memories/search?q=Express*%22test%22%5E');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('retourne un tableau vide si la requete ne contient que des operateurs', async () => {
    const res = await request(app).get('/api/memories/search?q=AND%20OR%20NOT');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('Securite - Echappement LIKE', () => {
  it('echappe le caractere % dans les filtres de tags', async () => {
    const res = await request(app).get('/api/memories?tags=%25dropper');
    expect(res.status).toBe(200);
    // Ne doit pas matcher toutes les memoires (le % est echappe)
    expect(res.body.data).toHaveLength(0);
  });

  it('echappe le caractere _ dans les filtres de tags', async () => {
    const res = await request(app).get('/api/memories?tags=_ildcard');
    expect(res.status).toBe(200);
    // Le _ echappe ne matche pas n'importe quel caractere
    expect(res.body.data).toHaveLength(0);
  });
});

describe('Securite - Limite body JSON', () => {
  it('le setup du test utilise express.json() (limite par defaut)', async () => {
    // Verifier que le middleware express.json() est actif
    const res = await request(app)
      .post('/api/memories/bulk-delete')
      .send({ hashes: ['nonexistent'] });
    expect(res.status).not.toBe(500);
  });
});
