import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ClusterView } from '../src/pages/ClusterView';
import { LanguageProvider } from '../src/i18n/LanguageContext';

const MOCK_CLUSTERS = {
  clusters: [
    {
      id: 0,
      label: 'note',
      size: 3,
      members: [
        { id: 1, content_hash: 'hash_a', content: 'Config Express.', memory_type: 'note', tags: ['express'], metadata: null, created_at: 1, updated_at: 1, created_at_iso: '2026-02-14T16:53:20.000Z', updated_at_iso: '2026-02-14T16:53:20.000Z' },
        { id: 2, content_hash: 'hash_b', content: 'Pattern PowerShell.', memory_type: 'note', tags: ['powershell'], metadata: null, created_at: 2, updated_at: 2, created_at_iso: '2026-02-14T16:56:40.000Z', updated_at_iso: '2026-02-14T16:56:40.000Z' },
        { id: 3, content_hash: 'hash_c', content: 'Observation FTS5.', memory_type: 'observation', tags: ['fts5'], metadata: null, created_at: 3, updated_at: 3, created_at_iso: '2026-02-14T17:00:00.000Z', updated_at_iso: '2026-02-14T17:00:00.000Z' },
      ],
      avg_similarity: 0.72,
      centroid: { x: 1.23, y: -0.45 },
    },
    {
      id: 1,
      label: 'decision',
      size: 2,
      members: [
        { id: 4, content_hash: 'hash_d', content: 'Decision SQLite.', memory_type: 'decision', tags: ['sqlite'], metadata: null, created_at: 4, updated_at: 4, created_at_iso: '2026-02-14T17:03:20.000Z', updated_at_iso: '2026-02-14T17:03:20.000Z' },
        { id: 5, content_hash: 'hash_e', content: 'Decision architecture.', memory_type: 'decision', tags: ['architecture'], metadata: null, created_at: 5, updated_at: 5, created_at_iso: '2026-02-14T17:05:00.000Z', updated_at_iso: '2026-02-14T17:05:00.000Z' },
      ],
      avg_similarity: 0.85,
      centroid: { x: 3.67, y: 2.89 },
    },
  ],
  total_clusters: 2,
  params: { threshold: 0.6, min_size: 2 },
};

const MOCK_EMPTY = {
  clusters: [],
  total_clusters: 0,
  params: { threshold: 0.6, min_size: 2 },
};

function renderClusterView(mockData?: typeof MOCK_CLUSTERS) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockData ?? MOCK_CLUSTERS),
    } as Response);
  });

  render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter>
          <ClusterView />
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('ClusterView', () => {
  it('affiche le titre "Clusters semantiques"', async () => {
    renderClusterView();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Semantic clusters/i })).toBeDefined();
    });
  });

  it('affiche le nombre de clusters', async () => {
    renderClusterView();

    await waitFor(() => {
      expect(screen.getByText(/2 clusters/i)).toBeDefined();
    });
  });

  it('affiche le ScatterPlot (canvas)', async () => {
    renderClusterView();

    await waitFor(() => {
      expect(screen.getByTestId('scatter-plot')).toBeDefined();
    });
  });

  it('affiche la liste des clusters avec taille', async () => {
    renderClusterView();

    await waitFor(() => {
      expect(screen.getByText(/3 memories/i)).toBeDefined();
      expect(screen.getByText(/2 memories/i)).toBeDefined();
    });
  });

  it('slider threshold change la valeur', async () => {
    renderClusterView();

    await waitFor(() => {
      expect(screen.getByTestId('scatter-plot')).toBeDefined();
    });

    const slider = screen.getByLabelText(/Threshold/i) as HTMLInputElement;
    expect(slider).toBeDefined();

    fireEvent.change(slider, { target: { value: '0.8' } });

    await waitFor(() => {
      const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const clusterCalls = calls.filter((call: unknown[]) => {
        const url = typeof call[0] === 'string' ? call[0] : (call[0] as Request).url;
        return url.includes('/api/memories/clusters');
      });
      const lastCall = clusterCalls[clusterCalls.length - 1];
      expect(lastCall[0]).toContain('threshold=0.8');
    });
  });

  it('affiche message si aucun cluster', async () => {
    renderClusterView(MOCK_EMPTY);

    await waitFor(() => {
      expect(screen.getByText(/No clusters/i)).toBeDefined();
    });
  });

  it('cluster affiche le label (type dominant)', async () => {
    renderClusterView();

    await waitFor(() => {
      expect(screen.getByText('note')).toBeDefined();
      expect(screen.getByText('decision')).toBeDefined();
    });
  });

  it('cluster affiche la similarite moyenne', async () => {
    renderClusterView();

    await waitFor(() => {
      expect(screen.getByText(/0\.72/)).toBeDefined();
      expect(screen.getByText(/0\.85/)).toBeDefined();
    });
  });
});
