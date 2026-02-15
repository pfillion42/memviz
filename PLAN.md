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
- [x] Redesign UI theme sombre moderne (Sprint 4 - CSS custom properties, logo SVG, style Supabase/Vercel)
- [x] ESLint v9 flat config (eslint.config.js/mjs, react-hooks, react-refresh)

## Sprint 5 - Filtrage, doublons et operations en masse

### 5.1 Filtres avances (MemoryList) - COMPLETE
- Backend : query params type, tags, from, to, quality_min, quality_max (AND logique, pagination compatible)
- Frontend : FilterPanel collapsible, persistence URL via useSearchParams, badge filtres actifs

### 5.2 Operations en masse - COMPLETE
- Backend : POST bulk-delete, bulk-tag, bulk-type avec validation
- Frontend : checkboxes, BulkActionBar fixee en bas, confirmation avant suppression
- Dashboard comme page d'accueil (/ → Dashboard, /memories → MemoryList)

### 5.3 Detection de doublons - A FAIRE
**Backend** : `GET /api/memories/duplicates?threshold=0.9`
- Pour chaque memoire, chercher les voisins vectoriels avec similarite > threshold
- Retourner les groupes de doublons (clusters) tries par similarite decroissante

**Frontend** : Page /duplicates
- Liste des groupes de doublons avec pourcentage de similarite
- Apercu du contenu cote a cote
- Actions : fusionner (garder un, supprimer les autres), ignorer
- Compteur de doublons dans le Dashboard

## Backlog - Fonctionnalites futures

### Exploration et comprehension
- [ ] Projection 2D des embeddings (t-SNE/UMAP) - vue espace vectoriel complet
- [ ] Clustering automatique - grouper par proximite semantique
- [ ] Vue timeline - chronologie visuelle des memoires

### Navigation et UX
- [ ] Raccourcis clavier (j/k navigation, / recherche, e editer)
- [ ] Mode clair / toggle theme
- [ ] Pagination recherche vectorielle

### Gestion et maintenance
- [ ] Gestion globale des tags - renommer, fusionner, supprimer un tag partout
- [ ] Memoires obsoletes - identifier et suggerer nettoyage (jamais accedees, anciennes)
- [ ] Score de qualite - interface vote thumbs up/down, tri par qualite

### Synchronisation et integration
- [ ] Live reload - surveiller la DB SQLite, mise a jour temps reel
- [ ] Diff entre memoires - comparer deux memoires cote a cote

### Qualite
- [ ] Tests E2E (Playwright/Cypress)

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
- Frontend : React Query + React Router, hooks custom, theme sombre via CSS custom properties
- Navigation : / (Dashboard), /memories (MemoryList), /memories/:hash (MemoryDetail), /graph (GraphView)
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
| 2026-02-14 | Sprint 4 redesign UI + ESLint | Theme sombre moderne, logo SVG, ESLint v9 flat config, 80 tests verts |
| 2026-02-14 | Sprint 5.1 filtres avances | FilterPanel, query params backend, persistence URL, 100 tests verts |
| 2026-02-14 | Sprint 5.2 operations en masse | Bulk delete/tag/type, BulkActionBar, Dashboard homepage, 126 tests verts |
