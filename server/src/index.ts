import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getDb, closeDb } from './db';
import { createMemoriesRouter } from './routes/memories';
import { initEmbedder, getEmbedder } from './embedder';

const app = express();
const PORT = process.env.PORT || 3001;

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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialisation asynchrone : charger l'embedder puis demarrer
async function start() {
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
