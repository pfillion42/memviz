import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// Mock react-force-graph-2d (Canvas non supporte dans JSDOM)
import { forwardRef } from 'react';
vi.mock('react-force-graph-2d', () => ({
  default: forwardRef<unknown, Record<string, unknown>>(function MockForceGraph() { return <div data-testid="force-graph-mock" />; }),
}));

import { GraphView } from '../src/pages/GraphView';

const MOCK_GRAPH = {
  nodes: [
    { id: 'hash_aaa', content: 'Config Express', memory_type: 'note', tags: ['express'] },
    { id: 'hash_bbb', content: 'Decision SQLite', memory_type: 'decision', tags: ['sqlite'] },
    { id: 'hash_ccc', content: 'Pattern PowerShell', memory_type: 'note', tags: ['powershell'] },
  ],
  links: [
    { source: 'hash_aaa', target: 'hash_bbb', similarity: 0.78, relationship_type: 'related' },
    { source: 'hash_bbb', target: 'hash_ccc', similarity: 0.65, relationship_type: 'supports' },
  ],
};

const EMPTY_GRAPH = { nodes: [], links: [] };

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

describe('GraphView', () => {
  it('affiche le chargement', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise(() => {})
    );
    render(<GraphView />, { wrapper: createWrapper() });
    expect(screen.getByText(/chargement/i)).toBeDefined();
  });

  it('affiche le graphe avec les noeuds', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_GRAPH),
    } as Response);

    render(<GraphView />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Le conteneur du graphe doit etre present
      expect(screen.getByTestId('graph-container')).toBeDefined();
    });
  });

  it('affiche les statistiques du graphe', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_GRAPH),
    } as Response);

    render(<GraphView />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/3 noeuds/i)).toBeDefined();
      expect(screen.getByText(/2 liens/i)).toBeDefined();
    });
  });

  it('affiche un message quand le graphe est vide', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(EMPTY_GRAPH),
    } as Response);

    render(<GraphView />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/aucune association/i)).toBeDefined();
    });
  });

  it('affiche une erreur en cas d\'echec', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    } as Response);

    render(<GraphView />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/erreur/i)).toBeDefined();
    });
  });
});
