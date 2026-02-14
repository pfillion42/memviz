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

---
<!-- Ajouter les nouvelles entrees en haut du fichier -->
