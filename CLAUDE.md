# memviz

## Description
Application d'exploration de la memoire vectorielle locale avec UI inspiree de Supabase/Pinecone,
interfacable avec Claude. Frontend React/Vite/TypeScript + Backend Express/TypeScript.

## Structure du projet
```
memviz/
├── server/          # API Express TypeScript
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── index.ts
│   ├── tests/
│   └── package.json
├── client/          # UI React Vite TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tests/
│   └── package.json
├── .claude/         # Hooks projet
├── .github/workflows/
├── CLAUDE.md        # Regles du projet (ce fichier)
├── PLAN.md          # Etat d'avancement
└── DEVLOG.md        # Journal des decisions
```

## Commandes utiles
- **Tests serveur** : `cd server && npm test`
- **Tests client** : `cd client && npm test`
- **Dev serveur** : `cd server && npm run dev`
- **Dev client** : `cd client && npm run dev`
- **Lint serveur** : `cd server && npm run lint`
- **Lint client** : `cd client && npm run lint`
- **Build client** : `cd client && npm run build`

## Conventions specifiques au projet
- Monorepo avec 2 packages independants (server/ et client/)
- API RESTful sous `/api/` (proxy Vite en dev)
- TypeScript strict dans les 2 projets
- Tests avec Vitest (server et client)
- Francais sans accents dans le code et les commentaires

## Fichiers importants
- `CLAUDE.md` : Regles du projet (ce fichier)
- `PLAN.md` : Etat d'avancement et prochaines actions
- `DEVLOG.md` : Journal des decisions et problemes resolus
