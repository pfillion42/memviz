import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { MemoryList } from '../src/pages/MemoryList';

const MOCK_RESPONSE = {
  data: [
    {
      id: 1,
      content_hash: 'hash_aaa',
      content: 'Configuration Express avec TypeScript',
      tags: ['express', 'typescript'],
      memory_type: 'note',
      metadata: { access_count: 3 },
      created_at: 1771088000,
      updated_at: 1771088100,
      created_at_iso: '2026-02-14T16:53:20.000Z',
      updated_at_iso: '2026-02-14T16:54:40.000Z',
    },
    {
      id: 2,
      content_hash: 'hash_bbb',
      content: 'Decision architecture SQLite-vec',
      tags: ['architecture', 'sqlite'],
      memory_type: 'decision',
      metadata: null,
      created_at: 1771088200,
      updated_at: 1771088200,
      created_at_iso: '2026-02-14T16:56:40.000Z',
      updated_at_iso: '2026-02-14T16:56:40.000Z',
    },
  ],
  total: 2,
  limit: 50,
  offset: 0,
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

describe('MemoryList', () => {
  it('affiche un indicateur de chargement', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise(() => {}) // jamais resolu
    );
    render(<MemoryList />, { wrapper: createWrapper() });
    expect(screen.getByText(/chargement/i)).toBeDefined();
  });

  it('affiche la liste des memoires apres chargement', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_RESPONSE),
    } as Response);

    render(<MemoryList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Configuration Express/)).toBeDefined();
    });
    expect(screen.getByText(/Decision architecture/)).toBeDefined();
  });

  it('affiche les tags sous forme de badges', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_RESPONSE),
    } as Response);

    render(<MemoryList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('express')).toBeDefined();
    });
    expect(screen.getByText('typescript')).toBeDefined();
  });

  it('affiche le type de memoire', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_RESPONSE),
    } as Response);

    render(<MemoryList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('note')).toBeDefined();
    });
    expect(screen.getByText('decision')).toBeDefined();
  });

  it('affiche un champ de recherche', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_RESPONSE),
    } as Response);

    render(<MemoryList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByLabelText('Recherche')).toBeDefined();
    });
  });

  it('affiche un message d\'erreur en cas d\'echec', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal error' }),
    } as Response);

    render(<MemoryList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/erreur/i)).toBeDefined();
    });
  });

  it('affiche le panneau de filtres', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_RESPONSE),
    } as Response);

    render(<MemoryList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Filtres')).toBeDefined();
    });
  });
});
