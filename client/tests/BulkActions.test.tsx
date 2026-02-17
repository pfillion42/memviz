import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { MemoryList } from '../src/pages/MemoryList';
import { LanguageProvider } from '../src/i18n/LanguageContext';

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

describe('BulkActions', () => {
  it('affiche des checkboxes dans le tableau', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_RESPONSE),
    } as Response);

    render(<MemoryList />, { wrapper: createWrapper() });

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      // 1 checkbox header + 2 checkboxes de lignes = 3 total
      expect(checkboxes.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('affiche une checkbox "Selectionner tout" dans le header', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_RESPONSE),
    } as Response);

    render(<MemoryList />, { wrapper: createWrapper() });

    await waitFor(() => {
      const headerCheckbox = screen.getByLabelText(/select all/i);
      expect(headerCheckbox).toBeDefined();
    });
  });

  it('clic sur checkbox selectionne/deselectionne une memoire', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_RESPONSE),
    } as Response);

    render(<MemoryList />, { wrapper: createWrapper() });

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(3);
    });

    const checkboxes = screen.getAllByRole('checkbox');
    const firstLineCheckbox = checkboxes[1] as HTMLInputElement; // Index 0 = header, 1 = premiere ligne

    // Clic pour selectionner
    await user.click(firstLineCheckbox);
    expect(firstLineCheckbox.checked).toBe(true);

    // Clic pour deselectionner
    await user.click(firstLineCheckbox);
    expect(firstLineCheckbox.checked).toBe(false);
  });

  it('la barre d\'actions apparait quand >= 1 memoire selectionnee', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_RESPONSE),
    } as Response);

    render(<MemoryList />, { wrapper: createWrapper() });

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(3);
    });

    // La barre ne doit pas etre visible au debut
    expect(screen.queryByText(/selected/i)).toBeNull();

    // Selectionner une memoire
    const checkboxes = screen.getAllByRole('checkbox');
    const firstLineCheckbox = checkboxes[1];
    await user.click(firstLineCheckbox);

    // La barre doit apparaitre
    await waitFor(() => {
      expect(screen.getByText(/1 memory selected/i)).toBeDefined();
    });
  });

  it('la barre affiche le compteur "X memoire(s) selectionnee(s)"', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_RESPONSE),
    } as Response);

    render(<MemoryList />, { wrapper: createWrapper() });

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(3);
    });

    // Selectionner 2 memoires
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);
    await user.click(checkboxes[2]);

    // Le compteur doit afficher 2
    await waitFor(() => {
      expect(screen.getByText(/2 memories selected/i)).toBeDefined();
    });
  });

  it('bouton Supprimer ouvre une confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_RESPONSE),
    } as Response);

    render(<MemoryList />, { wrapper: createWrapper() });

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(3);
    });

    // Selectionner une memoire
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);

    // Cliquer sur le bouton Supprimer
    await waitFor(() => {
      expect(screen.getByText(/delete/i)).toBeDefined();
    });

    const deleteButton = screen.getByText(/delete/i);
    await user.click(deleteButton);

    // window.confirm doit avoir ete appele
    expect(confirmSpy).toHaveBeenCalled();
  });

  it('deselection apres action', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/memories?')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_RESPONSE),
        } as Response);
      }
      if (typeof url === 'string' && url.includes('/api/memories/bulk-delete')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ deleted: 1 }),
        } as Response);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<MemoryList />, { wrapper: createWrapper() });

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(3);
    });

    // Selectionner une memoire
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);

    // Cliquer sur le bouton Supprimer
    await waitFor(() => {
      expect(screen.getByText(/delete/i)).toBeDefined();
    });

    const deleteButton = screen.getByText(/delete/i);
    await user.click(deleteButton);

    // La barre d'actions doit disparaitre apres la suppression
    await waitFor(() => {
      expect(screen.queryByText(/selected/i)).toBeNull();
    });
  });
});
