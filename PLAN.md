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

### 5.1 Filtres avances (MemoryList)
**Backend** : `GET /api/memories?type=note&tags=python,react&from=2026-01-01&to=2026-02-14&quality_min=0.5`
- Parametres query : `type`, `tags` (virgule-separes), `from`, `to` (dates ISO), `quality_min`, `quality_max`
- Combinables entre eux (AND logique)
- Compatible avec la pagination existante (offset/limit)

**Frontend** : Panneau de filtres dans MemoryList
- Dropdown type (liste dynamique depuis l'API)
- Multi-select tags (depuis GET /api/tags existant)
- Date range picker (from/to)
- Slider qualite (0-1)
- Bouton "Reinitialiser filtres"
- Les filtres persistent dans l'URL (query params) pour le partage/bookmarks

### 5.2 Detection de doublons
**Backend** : `GET /api/memories/duplicates?threshold=0.9`
- Pour chaque memoire, chercher les voisins vectoriels avec similarite > threshold
- Retourner les groupes de doublons (clusters) tries par similarite decroissante
- Exclure les paires deja dans le graphe d'associations

**Frontend** : Page /duplicates
- Liste des groupes de doublons avec pourcentage de similarite
- Apercu du contenu cote a cote
- Actions : fusionner (garder un, supprimer les autres), ignorer, marquer comme distincts
- Compteur de doublons dans le Dashboard

### 5.3 Operations en masse
**Backend** :
- `POST /api/memories/bulk-delete` : body `{ hashes: string[] }`
- `POST /api/memories/bulk-tag` : body `{ hashes: string[], add_tags: string[], remove_tags: string[] }`
- `POST /api/memories/bulk-type` : body `{ hashes: string[], memory_type: string }`

**Frontend** : Mode selection dans MemoryList
- Checkbox par ligne + "Selectionner tout"
- Barre d'actions flottante : Supprimer, Ajouter tag, Changer type
- Confirmation modale avant suppression
- Compteur de selection

### Ordre d'implementation
1. Filtres avances (backend + frontend)
2. Operations en masse (backend + frontend)
3. Detection de doublons (backend + frontend)

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
| 2026-02-14 | Sprint 4 redesign UI + ESLint | Theme sombre moderne, logo SVG, ESLint v9 flat config, 80 tests verts |
