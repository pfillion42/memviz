# Plan - memviz

> **INSTRUCTION CLAUDE** : Lis ce fichier au debut de chaque session.

## Contexte
Application d'exploration de la memoire vectorielle locale avec UI inspiree de Supabase/Pinecone.
Permet de visualiser, rechercher, modifier et supprimer les entrees de memoire vectorielle,
avec une interface web moderne et une API backend. Interfacable avec Claude.

## Etat actuel
- [x] Initialisation du projet (structure, tests, hooks, CI/CD, GitHub)
- [ ] Definir le format de stockage vectoriel local (SQLite + vec extension ? fichiers JSON ?)
- [ ] API CRUD memoire vectorielle (server/src/routes/)
- [ ] UI liste des memoires avec recherche (client/src/pages/)
- [ ] UI detail/edition d'une entree memoire
- [ ] Recherche par similarite vectorielle
- [ ] Import/export des memoires
- [ ] Integration Claude (lecture/ecriture via MCP ou API)

## Prochaine action
Definir le format de stockage de la memoire vectorielle locale et creer le schema de donnees.

## Decisions prises
- Structure : express-react (monorepo server/ + client/)
- Tests : Vitest (server et client)
- CI/CD : GitHub Actions
- TypeScript strict dans les deux projets

## Journal des sessions

| Date | Actions | Resultat |
|------|---------|----------|
| 2026-02-14 | Initialisation du projet avec /init-project | Structure creee, repo GitHub, workflow configure |
