import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Stale } from '../src/pages/Stale';

const MOCK_STALE = {
  data: [
    {
      id: 1,
      content_hash: 'hash_old',
      content: 'Memoire tres ancienne de faible qualite.',
      tags: ['obsolete', 'old'],
      memory_type: 'note',
      metadata: { quality_score: 0.25 },
      created_at: 1700000000, // Tres ancien
      updated_at: 1700000100,
      created_at_iso: '2023-11-15T00:00:00.000Z',
      updated_at_iso: '2023-11-15T00:01:40.000Z',
    },
    {
      id: 2,
      content_hash: 'hash_low',
      content: 'Memoire de faible qualite.',
      tags: ['low-quality'],
      memory_type: 'observation',
      metadata: { quality_score: 0.15 },
      created_at: 1771088000,
      updated_at: 1771088100,
      created_at_iso: '2026-02-14T16:53:20.000Z',
      updated_at_iso: '2026-02-14T16:54:40.000Z',
    },
  ],
  total: 2,
  criteria: {
    days: 90,
    quality_max: 0.3,
  },
};

const MOCK_EMPTY_STALE = {
  data: [],
  total: 0,
  criteria: {
    days: 90,
    quality_max: 0.3,
  },
};

function renderStale(mockData?: typeof MOCK_STALE) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    if (urlStr.includes('/api/memories/stale')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData ?? MOCK_STALE),
      } as Response);
    }
    if (urlStr.includes('/api/memories/bulk-delete')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ deleted: 1 }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Stale />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('Stale', () => {
  it('affiche le titre "Memoires obsoletes"', async () => {
    renderStale();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Memoires obsoletes/i })).toBeDefined();
    });
  });

  it('affiche loading puis les resultats', async () => {
    renderStale();

    // Attendre que les memoires soient affichees
    await waitFor(() => {
      expect(screen.getByText(/Memoire tres ancienne de faible qualite/i)).toBeDefined();
    });

    expect(screen.getByText(/Memoire de faible qualite/i)).toBeDefined();
  });

  it('affiche un message si aucune memoire obsolete', async () => {
    renderStale(MOCK_EMPTY_STALE);

    await waitFor(() => {
      expect(screen.getByText(/Aucune memoire obsolete trouvee/i)).toBeDefined();
    });
  });

  it('affiche le compteur total', async () => {
    renderStale();

    await waitFor(() => {
      expect(screen.getByText(/2 memoires obsoletes/i)).toBeDefined();
    });
  });

  it('le slider age modifie la requete', async () => {
    renderStale();

    await waitFor(() => {
      expect(screen.getByText(/Memoire tres ancienne/i)).toBeDefined();
    });

    const slider = screen.getByLabelText(/Age minimum/i) as HTMLInputElement;
    expect(slider).toBeDefined();

    // Modifier la valeur du slider via fireEvent (React onChange)
    fireEvent.change(slider, { target: { value: '180' } });

    // Verifier que fetch a ete appele avec days=180
    await waitFor(() => {
      const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const staleCalls = calls.filter((call: unknown[]) => {
        const url = typeof call[0] === 'string' ? call[0] : (call[0] as Request).url;
        return url.includes('/api/memories/stale');
      });
      const lastCall = staleCalls[staleCalls.length - 1];
      expect(lastCall[0]).toContain('days=180');
    });
  });

  it('affiche les badges de type', async () => {
    renderStale();

    await waitFor(() => {
      expect(screen.getByText('note')).toBeDefined();
      expect(screen.getByText('observation')).toBeDefined();
    });
  });

  it('affiche les tags', async () => {
    renderStale();

    await waitFor(() => {
      expect(screen.getByText('obsolete')).toBeDefined();
      expect(screen.getByText('old')).toBeDefined();
      expect(screen.getByText('low-quality')).toBeDefined();
    });
  });
});
