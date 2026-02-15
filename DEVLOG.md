# Journal de Developpement

## 2026-02-14 - Sprint 5.3 : Detection de doublons

### Backend
- **Endpoint** : `GET /api/memories/duplicates?threshold=0.85`
- **Algorithme** : Union-Find pour clustering transitif des memoires similaires
- **Recherche** : KNN via vec0 (cosine distance), comparaison par paire
- Route placee AVANT /:hash pour eviter la capture de route
- 8 nouveaux tests backend (503 sans embedder, format, seuil, clustering, exclusion)

### Frontend
- **Page /duplicates** : slider seuil (0.7-1.0), groupes de doublons avec apercu
- **Actions** : Garder (supprime les autres du groupe), Ignorer (dismiss le groupe)
- **Hook** : useDuplicates(threshold) avec React Query
- **Navigation** : lien "Doublons" dans le header, entre Memoires et Graphe
- 6 nouveaux tests frontend (loading, empty, groups, similarite, contenu, slider)

### Resultats
- 93 tests serveur + 47 tests client = **140 tests total**, tous verts
- TypeScript compile sans erreur, lint propre
- Equipe 2 agents paralleles (backend-dev + frontend-dev)

---

## 2026-02-14 - Sprint 5.1 + 5.2 : Filtres et operations en masse

### Sprint 5.1 - Filtres avances
- **Backend** : query params type, tags (OR logique LIKE), from/to (ISO→timestamp), quality_min/max (json_extract)
- **Frontend** : FilterPanel collapsible, checkboxes tags, date range, slider qualite
- Persistence URL via useSearchParams (bookmarkable)
- Refactor : useState initializer au lieu de useEffect pour eviter warning exhaustive-deps
- 14 nouveaux tests backend + 6 frontend = 100 tests total

### Sprint 5.2 - Operations en masse
- **Backend** : POST bulk-delete (soft delete), bulk-tag (add/remove, gestion doublons), bulk-type
- **Frontend** : BulkActionBar (position fixed bottom), checkboxes selection, Set<string> pour perf O(1)
- window.prompt()/confirm() pour les dialogs MVP
- Dashboard comme page d'accueil (/ → Dashboard, /memories → MemoryList)
- 19 nouveaux tests backend + 7 frontend = 126 tests total

### Decisions
- Tags filtres : OR logique (au moins un tag matche) - plus intuitif que AND
- Qualite : json_extract(metadata, '$.quality_score') en SQLite
- Filtres + recherche FTS/Vector : pas encore supportes ensemble (limitation documentee)
- Equipe 2 agents paralleles (backend-dev + frontend-dev) pour chaque sprint

---

## 2026-02-14 - Initialisation du projet

### Decisions prises
- Structure de projet : express-react (monorepo server/ + client/)
- Framework de test : Vitest (server et client)
- CI/CD : GitHub Actions
- Backend : Express + TypeScript (port 3001)
- Frontend : React + Vite + TypeScript (port 5173, proxy /api vers backend)
- Projet initialise avec le workflow optimise (TDD, hooks, agents)

### Notes
- L'objectif est de creer une UI similaire a Supabase/Pinecone pour explorer
  la memoire vectorielle locale de Claude Code
- Le format de stockage vectoriel reste a definir (prochaine session)

## 2026-02-14 - Sprint 4 : Redesign UI + ESLint

### Redesign theme sombre
- **Style** : Moderne sombre inspire de Supabase/Vercel
- **theme.css** : systeme complet de CSS custom properties (couleurs, radius, ombres, transitions, gradients)
- **Logo SVG** : composant `Logo.tsx` - motif reseau de noeuds avec gradient indigo/violet et effets glow
- **Composants rewrites** : SearchBar (focus glow), TagBadge (accent indigo), Pagination (dark buttons), QualityIndicator (CSS variables)
- **Pages rewritees** : MemoryList (table dark, hover rows), MemoryDetail (cards dark, metadata grid), Dashboard (stat cards, gradient bars), GraphView (fond #111113, glow nodes, particles indigo)
- **Navigation** : logo + titre gradient + badge "Memory Explorer"

### ESLint v9 flat config
- Mise a jour selon le skill init-project
- `server/eslint.config.mjs` : @eslint/js + typescript-eslint
- `client/eslint.config.js` : idem + eslint-plugin-react-hooks + eslint-plugin-react-refresh
- Corrections lint : `_err` inutilise (server), interfaces `GraphNode`/`GraphLink` inutilisees (client), mock forwardRef (test)

### Tests
- 80 tests toujours verts (52 serveur + 28 client)
- TypeScript compile sans erreur
- Lint propre des deux cotes

---

## 2026-02-14 - Sprint 3 : Features avancees

### Fonctionnalites implementees
- **CRUD write** : PUT /api/memories/:hash (edit tags/type/content), DELETE soft-delete
- **Recherche vectorielle** : @huggingface/transformers (all-MiniLM-L6-v2), endpoint /api/memories/vector-search, toggle Texte/Vectoriel dans MemoryList
- **Visualisation graphe** : react-force-graph-2d, page /graph avec couleurs par type, navigation au clic
- **Import/Export** : GET /api/memories/export (JSON download), POST /api/memories/import (upload JSON), boutons dans Dashboard

### Decisions techniques
- Injection de dependance pour l'embedder : `createMemoriesRouter(db, { embedFn })` - facilite les tests avec mock
- Embedder charge au demarrage de facon async, routes fonctionnent sans (503 si non dispo)
- vec0 requiert BigInt pour rowid et Buffer.from() pour les embeddings
- Mode readonly configurable via MEMORY_DB_READONLY (defaut: true)
- react-force-graph-2d mocke dans les tests JSDOM (Canvas non supporte)
- Routes /memories/export et /memories/import placees AVANT /memories/:hash (sinon "export" matche comme :hash)

### Tests
- Serveur : 52 tests (42 memories + 2 health + 5 export + 5 import)
- Client : 28 tests (4 App + 6 MemoryList + 7 MemoryDetail + 6 Dashboard + 5 GraphView)
- Total : 80 tests, tous verts
- TypeScript compile sans erreur (client + serveur)
- Build production : 428 KB / 138 KB gzip

---
<!-- Ajouter les nouvelles entrees en haut du fichier -->
