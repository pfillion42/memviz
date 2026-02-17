import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { EmbeddingView } from '../src/pages/EmbeddingView';
import { LanguageProvider } from '../src/i18n/LanguageContext';

const MOCK_PROJECTION = {
  points: [
    {
      content_hash: 'hash_aaa',
      x: 1.23,
      y: -0.45,
      content: 'Config Express TypeScript.',
      memory_type: 'note',
      tags: ['express', 'typescript'],
      created_at_iso: '2026-02-14T16:53:20.000Z',
    },
    {
      content_hash: 'hash_bbb',
      x: 3.67,
      y: 2.89,
      content: 'Decision architecture SQLite.',
      memory_type: 'decision',
      tags: ['architecture'],
      created_at_iso: '2026-02-14T16:56:40.000Z',
    },
    {
      content_hash: 'hash_ccc',
      x: -1.1,
      y: 0.5,
      content: 'Observation FTS5.',
      memory_type: 'observation',
      tags: ['fts5'],
      created_at_iso: '2026-02-14T17:00:00.000Z',
    },
  ],
  total: 3,
  params: { n_neighbors: 15, min_dist: 0.1 },
};

const MOCK_EMPTY = {
  points: [],
  total: 0,
  params: { n_neighbors: 15, min_dist: 0.1 },
};

function renderEmbeddingView(mockData?: typeof MOCK_PROJECTION) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockData ?? MOCK_PROJECTION),
    } as Response);
  });

  render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter>
          <EmbeddingView />
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

function renderEmbeddingViewError() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
    return Promise.resolve({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Erreur serveur' }),
    } as Response);
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <EmbeddingView />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('EmbeddingView', () => {
  it('affiche "Chargement..." pendant le fetch', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    // Mock fetch qui ne resout jamais (pour garder loading)
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}));

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EmbeddingView />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Loading/i)).toBeDefined();
  });

  it('affiche le titre "Espace vectoriel"', async () => {
    renderEmbeddingView();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Vector space/i })).toBeDefined();
    });
  });

  it('affiche le compteur de points', async () => {
    renderEmbeddingView();

    await waitFor(() => {
      expect(screen.getByText(/3 points/i)).toBeDefined();
    });
  });

  it('affiche la legende des types', async () => {
    renderEmbeddingView();

    await waitFor(() => {
      expect(screen.getByText('note')).toBeDefined();
      expect(screen.getByText('decision')).toBeDefined();
      expect(screen.getByText('observation')).toBeDefined();
    });
  });

  it('affiche le canvas scatter plot', async () => {
    renderEmbeddingView();

    await waitFor(() => {
      expect(screen.getByTestId('scatter-plot')).toBeDefined();
    });
  });

  it('gere l\'etat erreur', async () => {
    renderEmbeddingViewError();

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeDefined();
    });
  });

  it('gere l\'etat vide (0 points)', async () => {
    renderEmbeddingView(MOCK_EMPTY);

    await waitFor(() => {
      expect(screen.getByText(/No points/i)).toBeDefined();
    });
  });

  it('les sliders changent les parametres', async () => {
    renderEmbeddingView();

    await waitFor(() => {
      expect(screen.getByTestId('scatter-plot')).toBeDefined();
    });

    const slider = screen.getByLabelText(/Neighbors/i) as HTMLInputElement;
    expect(slider).toBeDefined();

    fireEvent.change(slider, { target: { value: '25' } });

    // Verifier que fetch a ete appele avec n_neighbors=25
    await waitFor(() => {
      const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const projCalls = calls.filter((call: unknown[]) => {
        const url = typeof call[0] === 'string' ? call[0] : (call[0] as Request).url;
        return url.includes('/api/memories/projection');
      });
      const lastCall = projCalls[projCalls.length - 1];
      expect(lastCall[0]).toContain('n_neighbors=25');
    });
  });
});
