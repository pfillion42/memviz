# Journal de Developpement

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
