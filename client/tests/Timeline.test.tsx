import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Timeline } from '../src/pages/Timeline';
import { LanguageProvider } from '../src/i18n/LanguageContext';

const MOCK_TIMELINE = {
  groups: [
    {
      date: '2026-02-14',
      count: 2,
      memories: [
        {
          id: 1,
          content_hash: 'hash_aaa',
          content: 'Configuration Express avec TypeScript et CORS pour le serveur memviz.',
          tags: ['express', 'typescript'],
          memory_type: 'note',
          metadata: { quality_score: 0.85 },
          created_at: 1771088000,
          updated_at: 1771088100,
          created_at_iso: '2026-02-14T16:53:20.000Z',
          updated_at_iso: '2026-02-14T16:54:40.000Z',
        },
        {
          id: 2,
          content_hash: 'hash_bbb',
          content: 'Ajout du systeme de recherche vectorielle avec embeddings cosine.',
          tags: ['search', 'vector'],
          memory_type: 'decision',
          metadata: null,
          created_at: 1771088200,
          updated_at: 1771088300,
          created_at_iso: '2026-02-14T18:00:00.000Z',
          updated_at_iso: '2026-02-14T18:01:00.000Z',
        },
      ],
    },
    {
      date: '2026-02-13',
      count: 1,
      memories: [
        {
          id: 3,
          content_hash: 'hash_ccc',
          content: 'Initialisation du projet memviz avec structure monorepo.',
          tags: ['setup'],
          memory_type: null,
          metadata: null,
          created_at: 1771001600,
          updated_at: 1771001700,
          created_at_iso: '2026-02-13T12:00:00.000Z',
          updated_at_iso: '2026-02-13T12:01:00.000Z',
        },
      ],
    },
  ],
  total: 3,
};

const MOCK_EMPTY_TIMELINE = {
  groups: [],
  total: 0,
};

function renderTimeline(mockData?: typeof MOCK_TIMELINE) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    if (urlStr.includes('/api/memories/timeline')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData ?? MOCK_TIMELINE),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: [], total: 0 }),
    } as Response);
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter initialEntries={['/timeline']}>
          <Timeline />
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('Timeline', () => {
  it('affiche le chargement initialement', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise(() => {})
    );
    render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <MemoryRouter>
            <Timeline />
          </MemoryRouter>
        </LanguageProvider>
      </QueryClientProvider>
    );
    expect(screen.getByText(/loading/i)).toBeDefined();
  });

  it('affiche un etat vide quand il n\'y a pas de memoires', async () => {
    renderTimeline(MOCK_EMPTY_TIMELINE);
    await waitFor(() => {
      expect(screen.getByText(/no memories/i)).toBeDefined();
    });
  });

  it('affiche les groupes par date', async () => {
    renderTimeline();
    await waitFor(() => {
      expect(screen.getByText(/2026-02-14/)).toBeDefined();
      expect(screen.getByText(/2026-02-13/)).toBeDefined();
    });
  });

  it('affiche le contenu tronque des memoires', async () => {
    renderTimeline();
    await waitFor(() => {
      expect(screen.getByText(/Configuration Express/)).toBeDefined();
      expect(screen.getByText(/recherche vectorielle/)).toBeDefined();
    });
  });

  it('affiche les badges de type', async () => {
    renderTimeline();
    await waitFor(() => {
      expect(screen.getByText('note')).toBeDefined();
      expect(screen.getByText('decision')).toBeDefined();
    });
  });

  it('affiche les tags via TagBadge', async () => {
    renderTimeline();
    await waitFor(() => {
      expect(screen.getByText('express')).toBeDefined();
      expect(screen.getByText('typescript')).toBeDefined();
      expect(screen.getByText('setup')).toBeDefined();
    });
  });

  it('contient des liens vers les details des memoires', async () => {
    renderTimeline();
    await waitFor(() => {
      const links = screen.getAllByRole('link');
      const detailLinks = links.filter(
        (link) => link.getAttribute('href')?.includes('/memories/')
      );
      expect(detailLinks.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('affiche le nombre total de memoires', async () => {
    renderTimeline();
    await waitFor(() => {
      expect(screen.getByText(/3 memor/i)).toBeDefined();
    });
  });
});
