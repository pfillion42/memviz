import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../src/pages/Dashboard';
import { LanguageProvider } from '../src/i18n/LanguageContext';

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

const MOCK_USAGE = {
  period: 'day',
  creations: [
    { date: '2026-02-13', count: 1 },
    { date: '2026-02-14', count: 6 },
  ],
  accesses: [
    { date: '2026-02-13', count: 2 },
    { date: '2026-02-14', count: 3 },
  ],
};

// Mock fetch qui differentie les URLs (stats vs usage-stats)
function mockFetchAll(statsOverride?: Record<string, unknown>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
    const url = typeof input === 'string' ? input : (input as Request).url;
    if (url.includes('usage-stats')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(MOCK_USAGE),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(statsOverride || MOCK_STATS),
    } as Response);
  });
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <MemoryRouter>{children}</MemoryRouter>
        </LanguageProvider>
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
    expect(screen.getByText(/loading/i)).toBeDefined();
  });

  it('affiche le total de memoires', async () => {
    mockFetchAll();
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('42')).toBeDefined();
    });
  });

  it('affiche la repartition par type', async () => {
    mockFetchAll();
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('note')).toBeDefined();
      expect(screen.getByText('decision')).toBeDefined();
      expect(screen.getByText('observation')).toBeDefined();
    });
  });

  it('affiche les tags les plus utilises', async () => {
    mockFetchAll();
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('powershell')).toBeDefined();
      expect(screen.getByText('typescript')).toBeDefined();
    });
  });

  it('affiche les boutons export et import', async () => {
    mockFetchAll();
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/export \(json\)/i)).toBeDefined();
      expect(screen.getByText(/import \(json\)/i)).toBeDefined();
    });
  });

  it('affiche la carte Acces totaux', async () => {
    mockFetchAll();
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('57')).toBeDefined();
      expect(screen.getByText(/total accesses/i)).toBeDefined();
    });
  });

  it('affiche la section Memoires les plus consultees', async () => {
    mockFetchAll();
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Most accessed memories')).toBeDefined();
    });
  });

  it('affiche les barres pour les top memoires', async () => {
    mockFetchAll();
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
    mockFetchAll(statsZero);
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/total accesses/i)).toBeDefined();
    });
  });

  it('affiche la section Statistiques d\'utilisation', async () => {
    mockFetchAll();
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/usage statistics/i)).toBeDefined();
    });
  });

  it('affiche le toggle jour/semaine/mois', async () => {
    mockFetchAll();
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Day')).toBeDefined();
      expect(screen.getByText('Week')).toBeDefined();
      expect(screen.getByText('Month')).toBeDefined();
    });
  });

  it('le toggle change la periode', async () => {
    const fetchSpy = mockFetchAll();
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Week')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Week'));

    await waitFor(() => {
      const calls = fetchSpy.mock.calls.map(c => {
        const input = c[0];
        return typeof input === 'string' ? input : (input as Request).url;
      });
      expect(calls.some(url => url.includes('period=week'))).toBe(true);
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
      expect(screen.getByText(/error/i)).toBeDefined();
    });
  });
});
