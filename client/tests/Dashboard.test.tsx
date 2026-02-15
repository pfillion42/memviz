import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../src/pages/Dashboard';

const MOCK_STATS = {
  total: 42,
  byType: { note: 20, decision: 15, observation: 7 },
  byTag: { express: 5, typescript: 8, architecture: 3, powershell: 10 },
  accessStats: {
    totalAccesses: 57,
    avgAccesses: 2.3,
    topAccessed: [
      { content_hash: 'hash_top1', content: 'Config serveur Express', memory_type: 'note', access_count: 23 },
      { content_hash: 'hash_top2', content: 'Architecture SQLite-vec', memory_type: 'decision', access_count: 18 },
      { content_hash: 'hash_top3', content: 'Pattern PowerShell Graph', memory_type: 'observation', access_count: 9 },
    ],
  },
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('Dashboard', () => {
  it('affiche le chargement', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise(() => {})
    );
    render(<Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/chargement/i)).toBeDefined();
  });

  it('affiche le total de memoires', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_STATS),
    } as Response);

    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('42')).toBeDefined();
    });
  });

  it('affiche la repartition par type', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_STATS),
    } as Response);

    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('note')).toBeDefined();
      expect(screen.getByText('decision')).toBeDefined();
      expect(screen.getByText('observation')).toBeDefined();
    });
  });

  it('affiche les tags les plus utilises', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_STATS),
    } as Response);

    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('powershell')).toBeDefined();
      expect(screen.getByText('typescript')).toBeDefined();
    });
  });

  it('affiche les boutons export et import', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_STATS),
    } as Response);

    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/exporter/i)).toBeDefined();
      expect(screen.getByText(/importer/i)).toBeDefined();
    });
  });

  it('affiche la carte Acces totaux', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_STATS),
    } as Response);

    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('57')).toBeDefined();
      expect(screen.getByText(/acces totaux/i)).toBeDefined();
    });
  });

  it('affiche la section Memoires les plus consultees', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_STATS),
    } as Response);

    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Memoires les plus consultees')).toBeDefined();
    });
  });

  it('affiche les barres pour les top memoires', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_STATS),
    } as Response);

    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Config serveur Express')).toBeDefined();
      expect(screen.getByText('23')).toBeDefined();
      expect(screen.getByText('18')).toBeDefined();
    });
  });

  it('gere 0 acces dans accessStats', async () => {
    const statsZero = {
      ...MOCK_STATS,
      accessStats: {
        totalAccesses: 0,
        avgAccesses: 0,
        topAccessed: [],
      },
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(statsZero),
    } as Response);

    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/acces totaux/i)).toBeDefined();
    });
  });

  it('affiche une erreur en cas d\'echec', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    } as Response);

    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/erreur/i)).toBeDefined();
    });
  });
});
