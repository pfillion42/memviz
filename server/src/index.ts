import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { getDb, closeDb } from './db';
import { createMemoriesRouter } from './routes/memories';
import { initEmbedder, getEmbedder } from './embedder';

const app = express();
const PORT = process.env.PORT || 3001;

// Securite : en-tetes HTTP securises (helmet)
// CSP desactive : serveur API-only, le CSP est gere par le frontend
// crossOriginResourcePolicy permissif : le frontend (Vite) fait des requetes cross-origin
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Securite : CORS restreint aux origines autorisees
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Permettre les requetes sans origin (curl, Postman, meme serveur)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origine non autorisee par CORS'));
    }
  },
}));

// Securite : limiter la taille du body a 5 MB
app.use(express.json({ limit: '5mb' }));

// Securite : rate-limit sur /api (100 req / 15 min)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Health check (public, pas d'auth requise)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialisation asynchrone : charger l'embedder puis demarrer
async function start() {
  // Securite : token API optionnel (si API_TOKEN est defini)
  if (process.env.API_TOKEN) {
    app.use('/api', (req, res, next) => {
      const auth = req.headers.authorization;
      if (auth !== `Bearer ${process.env.API_TOKEN}`) {
        res.status(401).json({ error: 'Token API invalide ou manquant' });
        return;
      }
      next();
    });
  }

  let embedFn;
  try {
    await initEmbedder();
    embedFn = getEmbedder();
    console.log('Embedder all-MiniLM-L6-v2 charge.');
  } catch (err) {
    console.warn('Embedder non disponible - recherche vectorielle desactivee.', err);
  }

  // Routes memories (avec embedder si disponible)
  app.use('/api', createMemoriesRouter(getDb(), { embedFn }));

  if (process.env.NODE_ENV !== 'test') {
    // Securite : ecouter uniquement sur localhost (pas expose au reseau)
    const HOST = process.env.HOST || '127.0.0.1';
    app.listen(Number(PORT), HOST, () => {
      console.log(`Serveur memviz demarre sur ${HOST}:${PORT}`);
    });
  }
}

start();

// Fermer la DB proprement a l'arret
process.on('SIGINT', () => {
  closeDb();
  process.exit(0);
});

export default app;
