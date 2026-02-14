# Plan - memviz

> **INSTRUCTION CLAUDE** : Lis ce fichier au debut de chaque session.

## Contexte
Application d'exploration de la memoire vectorielle locale avec UI inspiree de Supabase/Pinecone.
Permet de visualiser, rechercher, modifier et supprimer les entrees de memoire vectorielle,
avec une interface web moderne et une API backend. Interfacable avec Claude.

## Etat actuel
- [x] Initialisation du projet (structure, tests, hooks, CI/CD, GitHub)
- [x] Format de stockage : SQLite-vec (base existante du MCP Memory Service)
- [x] API lecture seule memoire vectorielle (Sprint 1 backend)
- [x] UI liste des memoires avec recherche (Sprint 2 frontend)
- [x] UI detail d'une entree memoire (Sprint 2 frontend)
- [x] Dashboard statistiques (Sprint 2 frontend)
- [x] Recherche par similarite vectorielle (Sprint 3 - backend embedder + frontend toggle)
- [x] Edition/suppression (Sprint 3 - PUT/DELETE + UI inline editing)
- [x] Visualisation du graphe d'associations (Sprint 3 - react-force-graph-2d)
- [x] Import/export des memoires (Sprint 3 - GET export + POST import + UI Dashboard)

## Prochaine action
Sprint 3 termine. Ameliorations possibles :
- Filtres avances (par type, par tag, par date)
- Mode sombre
- Pagination recherche vectorielle
- Tests E2E (Playwright/Cypress)

## Decisions prises
- Structure : express-react (monorepo server/ + client/)
- Tests : Vitest (server et client)
- CI/CD : GitHub Actions
- TypeScript strict dans les deux projets
- Stockage : SQLite-vec existant du MCP Memory Service (readonly)
- Chemin DB : `C:\Users\filli\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\Local\mcp-memory\sqlite_vec.db`
- Schema : 5 tables (memories, memory_content_fts fts5, memory_embeddings vec0, memory_graph, metadata)
- Embedding : all-MiniLM-L6-v2 (384 dims, cosine distance)
- Injection de dependance : `createMemoriesRouter(db)` pour faciliter les tests
- Frontend : React Query + React Router, hooks custom, CSS inline minimal
- Navigation : / (MemoryList), /memories/:hash (MemoryDetail), /dashboard (Dashboard), /graph (GraphView)
- Embedder : @huggingface/transformers (all-MiniLM-L6-v2), injection de dependance pour tests
- Graphe : react-force-graph-2d pour la visualisation force-directed
- Mode read/write : configurable via MEMORY_DB_READONLY env var

## Journal des sessions

| Date | Actions | Resultat |
|------|---------|----------|
| 2026-02-14 | Initialisation du projet avec /init-project | Structure creee, repo GitHub, workflow configure |
| 2026-02-14 | Sprint 1 backend API (TDD) | 6 endpoints REST, 25 tests verts, db.ts + routes/memories.ts |
| 2026-02-14 | Sprint 2 frontend UI (TDD) | 3 pages, 5 hooks, 4 composants, 22 tests verts, build OK |
| 2026-02-14 | Sprint 3 features avancees (TDD) | PUT/DELETE, vector search, graphe viz, import/export, 52+28=80 tests verts |
