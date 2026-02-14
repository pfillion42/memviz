import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MemoryDetail } from '../src/pages/MemoryDetail';

const MOCK_MEMORY = {
  id: 1,
  content_hash: 'hash_aaa',
  content: 'Configuration Express avec TypeScript et CORS pour le serveur memviz.',
  tags: ['express', 'typescript', 'config'],
  memory_type: 'note',
  metadata: {
    access_count: 3,
    last_accessed_at: 1771088600,
    quality_score: 0.85,
  },
  created_at: 1771088000,
  updated_at: 1771088100,
  created_at_iso: '2026-02-14T16:53:20.000Z',
  updated_at_iso: '2026-02-14T16:54:40.000Z',
};

const MOCK_GRAPH = {
  data: [
    {
      source_hash: 'hash_aaa',
      target_hash: 'hash_bbb',
      similarity: 0.78,
      connection_types: '["semantic","thematic"]',
      metadata: null,
      created_at: 1771088300,
      relationship_type: 'related',
    },
  ],
};

function renderWithRouter(hash: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/memories/${hash}`]}>
        <Routes>
          <Route path="/memories/:hash" element={<MemoryDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('MemoryDetail', () => {
  it('affiche le chargement initialement', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise(() => {})
    );
    renderWithRouter('hash_aaa');
    expect(screen.getByText(/chargement/i)).toBeDefined();
  });

  it('affiche le contenu complet de la memoire', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/graph')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_GRAPH),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(MOCK_MEMORY),
      } as Response);
    });

    renderWithRouter('hash_aaa');

    await waitFor(() => {
      expect(screen.getByText(/Configuration Express avec TypeScript/)).toBeDefined();
    });
  });

  it('affiche les tags', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/graph')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_GRAPH) } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_MEMORY) } as Response);
    });

    renderWithRouter('hash_aaa');

    await waitFor(() => {
      expect(screen.getByText('express')).toBeDefined();
      expect(screen.getByText('typescript')).toBeDefined();
      expect(screen.getByText('config')).toBeDefined();
    });
  });

  it('affiche le type de memoire', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/graph')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_GRAPH) } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_MEMORY) } as Response);
    });

    renderWithRouter('hash_aaa');

    await waitFor(() => {
      expect(screen.getByText('note')).toBeDefined();
    });
  });

  it('affiche les metadata formatees', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/graph')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_GRAPH) } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_MEMORY) } as Response);
    });

    renderWithRouter('hash_aaa');

    await waitFor(() => {
      expect(screen.getByText(/access_count/)).toBeDefined();
    });
  });

  it('affiche les associations du graphe', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/graph')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_GRAPH) } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_MEMORY) } as Response);
    });

    renderWithRouter('hash_aaa');

    await waitFor(() => {
      expect(screen.getByText(/hash_bbb/)).toBeDefined();
    });
  });

  it('affiche 404 pour un hash inexistant', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/graph')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) } as Response);
      }
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) } as Response);
    });

    renderWithRouter('hash_inexistant');

    await waitFor(() => {
      expect(screen.getByText(/non trouvee|erreur/i)).toBeDefined();
    });
  });
});
