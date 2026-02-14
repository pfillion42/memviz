import express from 'express';
import cors from 'cors';
import { getDb, closeDb } from './db';
import { createMemoriesRouter } from './routes/memories';
import { initEmbedder, getEmbedder } from './embedder';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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
    app.listen(PORT, () => {
      console.log(`Serveur memviz demarre sur le port ${PORT}`);
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
