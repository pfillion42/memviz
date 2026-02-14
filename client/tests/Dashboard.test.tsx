import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../src/pages/Dashboard';

const MOCK_STATS = {
  total: 42,
  byType: { note: 20, decision: 15, observation: 7 },
  byTag: { express: 5, typescript: 8, architecture: 3, powershell: 10 },
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
