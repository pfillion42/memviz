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

### 5.3 Detection de doublons - COMPLETE
- Backend : GET /api/memories/duplicates?threshold=0.85, Union-Find clustering, KNN vec0
- Frontend : Page /duplicates, slider seuil (0.7-1.0), groupes avec apercu, actions Garder/Ignorer

## Sprint 6 - Timeline et qualite

### 6.1 Vue timeline - COMPLETE
- Backend : GET /api/memories/timeline (groupement par jour, filtres type/tags)
- Frontend : Page /timeline avec axe chronologique vertical, groupes par date, badges et liens

### 6.2 Score de qualite - COMPLETE
- Backend : POST /api/memories/:hash/rate (rating +1/-1, quality_score +/-0.1, clamp 0-1)
- Frontend : QualityVoter (thumbs up/down, animation flash, mode compact), integre dans MemoryDetail et MemoryList

## Sprint 7 - Tags globaux et raccourcis clavier

### 7.1 Gestion globale des tags - COMPLETE
- Backend : PUT /api/tags/:tag (rename), DELETE /api/tags/:tag (remove), POST /api/tags/merge (fusion)
- Frontend : Page /tags avec liste, compteurs, rename inline, suppression, fusion par selection

### 7.2 Raccourcis clavier - COMPLETE
- Hook useKeyboardShortcuts : j/k navigation, / recherche, Enter ouvrir, Escape annuler, ? aide
- Modal KeyboardHelp avec liste des raccourcis

## Sprint 8 - Securite (correctifs audit)

### 8.1 Correctifs prioritaires - COMPLETE
1. Ecoute restreinte a `127.0.0.1` (pas expose au reseau)
2. CORS restreint aux origines autorisees (`CORS_ORIGINS` env var)
3. Limite body JSON a 5 MB (`express.json({ limit: '5mb' })`)
4. Chemin DB via `MEMORY_DB_PATH` obligatoire (plus de fallback hardcode)
5. Assainissement FTS5 MATCH (retrait operateurs AND/OR/NOT/*/"/^)
6. Echappement LIKE (`%` et `_`) dans tous les filtres de tags

### 8.2 Correctifs secondaires - BACKLOG
- [ ] Installer `helmet` (en-tetes HTTP securises)
- [ ] Ajouter `express-rate-limit` (protection DDoS basique)
- [ ] Validation d'entrees avec `zod` (schemas stricts)
- [ ] Token API optionnel (authentification legere)

## Sprint 9 - Theme clair et memoires obsoletes

### 9.1 Toggle theme clair/sombre - COMPLETE
- CSS : bloc `[data-theme="light"]` dans theme.css avec toutes les variables redefinies
- Hook : `useTheme()` avec localStorage + prefers-color-scheme
- UI : bouton soleil/lune dans le header App.tsx
- 9 tests ThemeToggle

### 9.2 Detection memoires obsoletes - COMPLETE
- Backend : GET /api/memories/stale (filtres days, quality_max, limit, tri ASC)
- Frontend : Page /stale avec sliders age/qualite, liste, boutons Supprimer/Tout supprimer
- Hook : useStaleMemories(days, qualityMax)
- Navigation : lien "Obsoletes" entre Tags et Graphe
- 11 tests backend + 7 tests frontend

## Sprint 10 - Projection 2D des embeddings

### 10.1 Backend - Endpoint projection UMAP - COMPLETE
- Backend : GET /api/memories/projection?n_neighbors=15&min_dist=0.1
- UMAP via umap-js (Google PAIR, BSD), calcul serveur, cache 5min
- Limite 5000 points, validation NaN-safe des parametres
- Invalidation cache sur modifications (PUT/DELETE/import/bulk)
- 8 tests backend

### 10.2 Frontend - Hook, ScatterPlot canvas et page - COMPLETE
- Types : ProjectionPoint, ProjectionResponse dans types.ts
- Hook : useProjection(nNeighbors, minDist) avec React Query
- Composant : ScatterPlot canvas 2D (zoom/pan/hover/clic)
- Page : /embeddings (EmbeddingView) avec sliders et legende
- Navigation : lien "Embeddings" entre Obsoletes et Graphe
- 8 tests frontend

## Backlog - Fonctionnalites futures

### Exploration et comprehension
- [x] Projection 2D des embeddings (UMAP) - vue espace vectoriel complet (Sprint 10)
- [ ] Clustering automatique - grouper par proximite semantique

### Navigation et UX
- [x] Mode clair / toggle theme (Sprint 9)
- [ ] Pagination recherche vectorielle

### Gestion et maintenance
- [x] Gestion globale des tags - renommer, fusionner, supprimer un tag partout (Sprint 7)
- [x] Memoires obsoletes - identifier et suggerer nettoyage (Sprint 9)

### Synchronisation et integration
- [ ] Live reload - surveiller la DB SQLite, mise a jour temps reel
- [ ] Diff entre memoires - comparer deux memoires cote a cote

### Statistiques et monitoring
- [ ] Compteur d'acces memoire (hit count) avec statistiques d'utilisation sur le Dashboard

### Qualite
- [ ] Tests E2E (Playwright/Cypress)

## Decisions prises
- Structure : express-react (monorepo server/ + client/)
- Tests : Vitest (server et client)
- CI/CD : GitHub Actions
- TypeScript strict dans les deux projets
- Stockage : SQLite-vec existant du MCP Memory Service (readonly)
- Chemin DB : via variable d'environnement `MEMORY_DB_PATH` (requis, defini dans server/.env)
- Schema : 5 tables (memories, memory_content_fts fts5, memory_embeddings vec0, memory_graph, metadata)
- Embedding : all-MiniLM-L6-v2 (384 dims, cosine distance)
- Injection de dependance : `createMemoriesRouter(db)` pour faciliter les tests
- Frontend : React Query + React Router, hooks custom, theme sombre via CSS custom properties
- Navigation : / (Dashboard), /timeline (Timeline), /memories (MemoryList), /memories/:hash (MemoryDetail), /duplicates (Duplicates), /tags (Tags), /stale (Stale), /embeddings (EmbeddingView), /graph (GraphView)
- Embedder : @huggingface/transformers (all-MiniLM-L6-v2), injection de dependance pour tests
- Graphe : react-force-graph-2d pour la visualisation force-directed
- Projection : umap-js (Google PAIR) pour la projection 2D des embeddings, calcul serveur avec cache
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
| 2026-02-14 | Sprint 5.3 detection doublons | Endpoint Union-Find, page /duplicates, slider seuil, 140 tests verts |
| 2026-02-14 | Sprint 6 timeline + qualite | Timeline chronologique, QualityVoter etoiles 1-5, 175 tests verts |
| 2026-02-14 | Sprint 7 tags + raccourcis | Gestion tags (rename/delete/merge), raccourcis clavier, 215 tests verts |
| 2026-02-14 | Sprint 8.1 securite | 6 correctifs : bind localhost, CORS, body limit, env DB, FTS5 sanitize, LIKE escape, 221 tests verts |
| 2026-02-14 | Sprint 9 theme + obsoletes | Toggle dark/light, page memoires obsoletes, 248 tests verts |
| 2026-02-14 | Sprint 10 projection 2D | Endpoint UMAP, ScatterPlot canvas, page /embeddings, 264 tests verts |
