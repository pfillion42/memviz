import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// --- Tests helmet (en-tetes HTTP securises) ---
describe('Securite - helmet', () => {
  it('ajoute X-Content-Type-Options: nosniff', async () => {
    const app = express();
    app.use(helmet());
    app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('ajoute X-Frame-Options', async () => {
    const app = express();
    app.use(helmet());
    app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

    const res = await request(app).get('/api/health');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('supprime X-Powered-By', async () => {
    const app = express();
    app.use(helmet());
    app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

// --- Tests rate-limit ---
describe('Securite - rate-limit', () => {
  it('ajoute le header RateLimit-Limit dans les reponses /api', async () => {
    const app = express();
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use('/api', limiter);
    app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

    const res = await request(app).get('/api/health');
    expect(res.headers['ratelimit-limit']).toBe('100');
  });

  it('ajoute le header RateLimit-Remaining', async () => {
    const app = express();
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use('/api', limiter);
    app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

    const res = await request(app).get('/api/health');
    expect(res.headers['ratelimit-remaining']).toBeDefined();
  });
});

// --- Tests token API optionnel ---
describe('Securite - token API', () => {
  const API_TOKEN = 'test-secret-token-xyz';

  function createTokenApp() {
    const app = express();
    app.use(express.json());

    // Health check (public, avant le middleware token)
    app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

    // Token middleware
    app.use('/api', (req, res, next) => {
      const auth = req.headers.authorization;
      if (auth !== `Bearer ${API_TOKEN}`) {
        res.status(401).json({ error: 'Token API invalide ou manquant' });
        return;
      }
      next();
    });

    // Route protegee de test
    app.get('/api/test', (_req, res) => res.json({ ok: true }));

    return app;
  }

  it('retourne 401 sans token sur une route protegee', async () => {
    const app = createTokenApp();
    const res = await request(app).get('/api/test');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('retourne 401 avec un token invalide', async () => {
    const app = createTokenApp();
    const res = await request(app)
      .get('/api/test')
      .set('Authorization', 'Bearer wrong-token');
    expect(res.status).toBe(401);
  });

  it('retourne 200 avec le bon token', async () => {
    const app = createTokenApp();
    const res = await request(app)
      .get('/api/test')
      .set('Authorization', `Bearer ${API_TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
  });

  it('health check reste accessible sans token', async () => {
    const app = createTokenApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('pas d\'auth requise si API_TOKEN non defini', async () => {
    // App sans middleware token (comportement par defaut)
    const app = express();
    app.use(express.json());
    app.get('/api/test', (_req, res) => res.json({ ok: true }));

    const res = await request(app).get('/api/test');
    expect(res.status).toBe(200);
  });
});
