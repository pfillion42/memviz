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

### 8.2 Correctifs secondaires - COMPLETE
1. `helmet` : en-tetes HTTP securises (X-Content-Type-Options, X-Frame-Options, suppression X-Powered-By)
2. `express-rate-limit` : 100 req / 15 min sur /api (headers RateLimit-Limit, RateLimit-Remaining)
3. Token API optionnel : middleware `Authorization: Bearer <token>` si `API_TOKEN` env defini, health check reste public
4. Validation `zod` : schemas stricts pour PUT memories, POST rate, bulk-delete, bulk-tag, bulk-type, import, PUT tags, POST tags/merge
   - Helper `validateBody(schema, req, res)` reutilisable
   - 8 schemas valident types, contraintes et champs requis

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

## Sprint 11 - Compteur d'acces memoire

### 11.1 Backend - POST /:hash/access - COMPLETE
- Endpoint POST /api/memories/:hash/access (incrementer access_count + set last_accessed_at)
- 6 tests backend (increment, initialisation, last_accessed_at, 404 hash/supprime, multiples appels)

### 11.2 Backend - Etendre GET /stats avec accessStats - COMPLETE
- accessStats { totalAccesses, avgAccesses, topAccessed[] } via json_extract
- 5 tests backend (presence, totalAccesses=12, tri DESC, champs, avgAccesses nombre)

### 11.3 Frontend - Auto-increment sur MemoryDetail - COMPLETE
- useEffect fire-and-forget POST /api/memories/:hash/access au montage
- 1 test frontend (verifie l'appel POST au montage)

### 11.4 Frontend - Etendre Dashboard - COMPLETE
- Types AccessedMemory, AccessStats dans types.ts (accessStats optionnel pour retrocompat)
- 4e carte "Acces totaux" dans le grid de stats
- Section "Memoires les plus consultees" (top 10 barres)
- 4 tests frontend (carte, section, barres, 0 acces)
- Guard defensif safeAccessStats pour compatibilite avec anciens mocks

### Bilan Sprint 11
- 11 tests backend + 5 tests frontend = 16 nouveaux tests
- Total : 280 tests (169 serveur + 111 client), tous verts
- Build client OK
- Audit securite : pas de vulnerabilite specifique au sprint, points preexistants (rate-limit, validation zod) dans backlog Sprint 8.2

## Sprint 12 - Statistiques d'utilisation par periode

### 12.1 Backend - Table memory_access_log + modifier POST /access - COMPLETE
- Table memory_access_log (id, content_hash, accessed_at) avec index
- CREATE TABLE IF NOT EXISTS au demarrage de createMemoriesRouter (try/catch readonly)
- INSERT dans memory_access_log apres chaque POST /:hash/access
- 3 tests backend (insertion, content_hash/accessed_at, multiples appels)

### 12.2 Backend - GET /api/memories/usage-stats - COMPLETE
- Endpoint GET /api/memories/usage-stats?period=day|week|month
- Creations groupees par periode (day/week/month) depuis memories
- Acces groupes par periode depuis memory_access_log
- Lookup map pour expressions SQL (securite : pas de concatenation dynamique)
- Validation period avec 400 si invalide
- 8 tests backend (period defaut, creations jour, accesses jour, week, month, invalide, tri ASC, vide)

### 12.3 Frontend - Types, hook, composant UsageChart - COMPLETE
- Types : UsagePeriod, UsageDataPoint, UsageStatsResponse dans types.ts
- Hook : useUsageStats(period) avec React Query
- Composant : UsageChart avec barres CSS (creations + acces), legende, responsive
- 4 tests frontend (barres creation, barres acces, legende, donnees vides)

### 12.4 Frontend - Integration Dashboard - COMPLETE
- Toggle 3 boutons (Jour/Semaine/Mois) avec state local
- Section "Statistiques d'utilisation" apres "Memoires les plus consultees"
- 3 tests frontend (section, toggle, changement periode)

### Bilan Sprint 12
- 11 tests backend + 7 tests frontend = 18 nouveaux tests
- Total : 298 tests (180 serveur + 118 client), tous verts
- Build client OK
- Audit securite : lookup map SQL (corrige), pas de vulnerabilite specifique, points preexistants (rate-limit, helmet, zod) dans backlog Sprint 8.2

## Sprint 13 - Clustering semantique automatique

### 13.1 Extraire UnionFind en classe reutilisable - COMPLETE
- Classe UnionFind exportee avec find(), union(), getClusters()
- Refactoring /duplicates pour utiliser la classe (0 regression)

### 13.2 Backend - Endpoint GET /api/memories/clusters - COMPLETE
- Parametres : threshold (0-1, defaut 0.6), min_size (>= 2, defaut 2)
- KNN vec0 50 voisins, Union-Find clustering, UMAP centroids
- Cache 5min avec invalidation sur modifications
- Validation 400 pour threshold hors [0,1] et min_size < 2
- 8 tests backend

### 13.3 Frontend - Page /clusters (ClusterView) - COMPLETE
- Types Cluster et ClustersResponse dans types.ts
- Hook useClusters(threshold, minSize) avec React Query
- Page ClusterView : ScatterPlot (60%) + liste clusters (40%)
- Sliders threshold (0.3-0.9) et min_size (2-10)
- ScatterPlot : prop colorMap pour coloration par cluster (10 couleurs)
- Route /clusters, NavLink entre Embeddings et Graphe
- 8 tests frontend

### Bilan Sprint 13
- 8 tests backend + 8 tests frontend = 16 nouveaux tests
- Total : 314 tests (188 serveur + 126 client), tous verts
- Build client OK
- Audit securite : pas de vulnerabilite specifique au sprint, points preexistants (rate-limit, helmet, zod) dans backlog Sprint 8.2

## Sprint 14 - DB separee pour les logs d'acces

### 14.1 Refactoring access log DB - COMPLETE
- Nouveau fichier `server/src/access-log-db.ts` : singleton writable (pattern identique a db.ts)
- Chemin : `ACCESS_LOG_DB_PATH` env var, ou derive de `MEMORY_DB_PATH` (remplace .db par _access.db)
- Table `memory_access_log` + index crees au premier appel, pas de sqlite-vec requis
- `RouterOptions.accessLogDb` optionnel dans createMemoriesRouter
- POST /:hash/access : UPDATE metadata dans main DB (try/catch readonly), INSERT dans accessLogDb
- GET /usage-stats : lecture des acces depuis accessLogDb au lieu de la DB principale
- Comportement graceful si accessLogDb absent (tableau vide, pas d'erreur)
- `memory_access_log` retiree du schema test principal, nouvelle fonction `createTestAccessLogDb()`
- 2 nouveaux tests : POST /access avec main DB readonly + GET /usage-stats lit depuis DB separee
- Correction lint pre-existante (hasRating non utilise)

### Bilan Sprint 14
- 2 nouveaux tests backend
- Total : 339 tests (213 serveur + 126 client), tous verts
- Lint serveur OK
- Build client inchange

## Backlog - Fonctionnalites futures

### Exploration et comprehension
- [x] Projection 2D des embeddings (UMAP) - vue espace vectoriel complet (Sprint 10)
- [x] Clustering automatique - grouper par proximite semantique (Sprint 13)

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
- [x] Compteur d'acces memoire (hit count) avec statistiques d'utilisation sur le Dashboard (Sprint 11)
- [x] Statistiques d'utilisation par periode (creations + acces par jour/semaine/mois) (Sprint 12)

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
- Injection de dependance : `createMemoriesRouter(db, { accessLogDb, embedFn })` pour faciliter les tests
- Access log : DB separee writable (`access-log-db.ts`), derive de MEMORY_DB_PATH si ACCESS_LOG_DB_PATH absent
- Frontend : React Query + React Router, hooks custom, theme sombre via CSS custom properties
- Navigation : / (Dashboard), /timeline (Timeline), /memories (MemoryList), /memories/:hash (MemoryDetail), /duplicates (Duplicates), /tags (Tags), /stale (Stale), /embeddings (EmbeddingView), /clusters (ClusterView), /graph (GraphView)
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
| 2026-02-14 | Sprint 11 compteur acces | POST access, accessStats, auto-increment MemoryDetail, Dashboard UI, 280 tests verts |
| 2026-02-14 | Sprint 12 usage stats | memory_access_log, GET usage-stats, UsageChart, toggle periode Dashboard, 298 tests verts |
| 2026-02-15 | Sprint 13 clustering semantique | UnionFind classe, GET clusters, ClusterView, ScatterPlot colorMap, 314 tests verts |
| 2026-02-15 | Sprint 8.2 securite secondaire | helmet, rate-limit, token API, validation zod (8 schemas), 337 tests verts |
| 2026-02-15 | Lanceur desktop | start/stop-memviz.bat/.ps1, raccourci bureau avec icone SVG→ICO, detection services existants |
| 2026-02-15 | Sprint 14 DB separee access log | access-log-db.ts singleton, refactoring POST /access + GET /usage-stats, 339 tests verts |
