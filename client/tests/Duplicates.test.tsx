import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Duplicates } from '../src/pages/Duplicates';

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('Duplicates', () => {
  it('affiche "Chargement..." pendant le loading', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      new Promise(() => {}) // Never resolves = loading
    );

    renderWithQueryClient(<Duplicates />);
    expect(screen.getByText('Chargement...')).toBeDefined();
  });

  it('affiche "Aucun doublon" quand pas de groupes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ groups: [], total_groups: 0 }),
    } as Response);

    renderWithQueryClient(<Duplicates />);

    await waitFor(() => {
      expect(screen.getByText(/Aucun doublon/)).toBeDefined();
    });
  });

  it('affiche les groupes de doublons quand il y en a', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        groups: [
          {
            similarity: 0.95,
            memories: [
              {
                id: 1,
                content_hash: 'hash1',
                content: 'Memoire test numero un',
                tags: ['test'],
                memory_type: 'note',
                metadata: null,
                created_at: 1700000000,
                updated_at: 1700000000,
                created_at_iso: '2023-11-14T22:13:20Z',
                updated_at_iso: '2023-11-14T22:13:20Z',
              },
              {
                id: 2,
                content_hash: 'hash2',
                content: 'Memoire test numero deux',
                tags: ['test'],
                memory_type: 'note',
                metadata: null,
                created_at: 1700000100,
                updated_at: 1700000100,
                created_at_iso: '2023-11-14T22:15:00Z',
                updated_at_iso: '2023-11-14T22:15:00Z',
              },
            ],
          },
        ],
        total_groups: 1,
      }),
    } as Response);

    renderWithQueryClient(<Duplicates />);

    await waitFor(() => {
      expect(screen.getByText('Memoire test numero un')).toBeDefined();
      expect(screen.getByText('Memoire test numero deux')).toBeDefined();
    });
  });

  it('affiche le pourcentage de similarite pour chaque groupe', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        groups: [
          {
            similarity: 0.92,
            memories: [
              {
                id: 1,
                content_hash: 'hash1',
                content: 'Contenu A',
                tags: [],
                memory_type: null,
                metadata: null,
                created_at: 1700000000,
                updated_at: 1700000000,
                created_at_iso: '2023-11-14T22:13:20Z',
                updated_at_iso: '2023-11-14T22:13:20Z',
              },
              {
                id: 2,
                content_hash: 'hash2',
                content: 'Contenu B',
                tags: [],
                memory_type: null,
                metadata: null,
                created_at: 1700000100,
                updated_at: 1700000100,
                created_at_iso: '2023-11-14T22:15:00Z',
                updated_at_iso: '2023-11-14T22:15:00Z',
              },
            ],
          },
        ],
        total_groups: 1,
      }),
    } as Response);

    renderWithQueryClient(<Duplicates />);

    await waitFor(() => {
      expect(screen.getByText('92%')).toBeDefined();
    });
  });

  it('affiche le contenu des memoires dans chaque groupe', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        groups: [
          {
            similarity: 0.88,
            memories: [
              {
                id: 1,
                content_hash: 'hash1',
                content: 'Premier contenu long pour tester la troncature a 200 caracteres',
                tags: ['tag1'],
                memory_type: 'decision',
                metadata: null,
                created_at: 1700000000,
                updated_at: 1700000000,
                created_at_iso: '2023-11-14T22:13:20Z',
                updated_at_iso: '2023-11-14T22:13:20Z',
              },
              {
                id: 2,
                content_hash: 'hash2',
                content: 'Deuxieme contenu long pour tester la troncature a 200 caracteres',
                tags: ['tag2'],
                memory_type: 'note',
                metadata: null,
                created_at: 1700000100,
                updated_at: 1700000100,
                created_at_iso: '2023-11-14T22:15:00Z',
                updated_at_iso: '2023-11-14T22:15:00Z',
              },
            ],
          },
        ],
        total_groups: 1,
      }),
    } as Response);

    renderWithQueryClient(<Duplicates />);

    await waitFor(() => {
      expect(screen.getByText(/Premier contenu long/)).toBeDefined();
      expect(screen.getByText(/Deuxieme contenu long/)).toBeDefined();
    });
  });

  it('le slider de threshold est present', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ groups: [], total_groups: 0 }),
    } as Response);

    renderWithQueryClient(<Duplicates />);

    await waitFor(() => {
      const slider = screen.getByRole('slider');
      expect(slider).toBeDefined();
      expect(slider.getAttribute('min')).toBe('0.7');
      expect(slider.getAttribute('max')).toBe('1');
      expect(slider.getAttribute('step')).toBe('0.05');
    });
  });
});
