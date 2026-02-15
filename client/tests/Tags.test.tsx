import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Tags } from '../src/pages/Tags';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function mockFetchForTags(
  tags: string[] = ['test', 'projet', 'debug'],
  byTag: Record<string, number> = { test: 5, projet: 3, debug: 1 }
) {
  vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    if (urlStr.includes('/api/tags')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: tags }),
      } as Response);
    }
    if (urlStr.includes('/api/memories/stats')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ total: 9, byType: {}, byTag }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    } as Response);
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('Tags', () => {
  it('affiche "Chargement..." pendant le loading', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}));
    renderWithProviders(<Tags />);
    expect(screen.getByText('Chargement...')).toBeDefined();
  });

  it('affiche la liste des tags avec leur compteur', async () => {
    mockFetchForTags();
    renderWithProviders(<Tags />);

    await waitFor(() => {
      expect(screen.getByText('test')).toBeDefined();
      expect(screen.getByText('projet')).toBeDefined();
      expect(screen.getByText('debug')).toBeDefined();
    });

    // Verifie les compteurs
    await waitFor(() => {
      expect(screen.getByText('5')).toBeDefined();
      expect(screen.getByText('3')).toBeDefined();
      expect(screen.getByText('1')).toBeDefined();
    });
  });

  it('trie les tags par compteur decroissant', async () => {
    mockFetchForTags();
    renderWithProviders(<Tags />);

    await waitFor(() => {
      const tagNames = screen.getAllByTestId('tag-name').map(el => el.textContent);
      expect(tagNames).toEqual(['test', 'projet', 'debug']);
    });
  });

  it('affiche un bouton renommer pour chaque tag', async () => {
    mockFetchForTags();
    renderWithProviders(<Tags />);

    await waitFor(() => {
      const renameButtons = screen.getAllByLabelText(/Renommer/);
      expect(renameButtons.length).toBe(3);
    });
  });

  it('affiche un bouton supprimer pour chaque tag', async () => {
    mockFetchForTags();
    renderWithProviders(<Tags />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByLabelText(/Supprimer/);
      expect(deleteButtons.length).toBe(3);
    });
  });

  it('entre en mode edition inline au clic sur renommer', async () => {
    mockFetchForTags();
    const user = userEvent.setup();
    renderWithProviders(<Tags />);

    await waitFor(() => {
      expect(screen.getByText('test')).toBeDefined();
    });

    const renameButtons = screen.getAllByLabelText(/Renommer/);
    await user.click(renameButtons[0]);

    await waitFor(() => {
      const input = screen.getByDisplayValue('test');
      expect(input).toBeDefined();
    });
  });

  it('annule le renommage avec Escape', async () => {
    mockFetchForTags();
    const user = userEvent.setup();
    renderWithProviders(<Tags />);

    await waitFor(() => {
      expect(screen.getByText('test')).toBeDefined();
    });

    const renameButtons = screen.getAllByLabelText(/Renommer/);
    await user.click(renameButtons[0]);

    const input = screen.getByDisplayValue('test');
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByDisplayValue('test')).toBeNull();
      expect(screen.getByText('test')).toBeDefined();
    });
  });

  it('envoie une requete PUT pour renommer un tag via Enter', async () => {
    mockFetchForTags();
    const user = userEvent.setup();
    renderWithProviders(<Tags />);

    await waitFor(() => {
      expect(screen.getByText('test')).toBeDefined();
    });

    const renameButtons = screen.getAllByLabelText(/Renommer/);
    await user.click(renameButtons[0]);

    const input = screen.getByDisplayValue('test');
    await user.clear(input);
    await user.type(input, 'test-renamed{Enter}');

    await waitFor(() => {
      const fetchCalls = vi.mocked(globalThis.fetch).mock.calls;
      const putCall = fetchCalls.find(([url, opts]) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        return urlStr.includes('/api/tags/test') && (opts as RequestInit)?.method === 'PUT';
      });
      expect(putCall).toBeDefined();
    });
  });

  it('affiche une confirmation avant la suppression', async () => {
    mockFetchForTags();
    const user = userEvent.setup();
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderWithProviders(<Tags />);

    await waitFor(() => {
      expect(screen.getByText('test')).toBeDefined();
    });

    const deleteButtons = screen.getAllByLabelText(/Supprimer/);
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
  });

  it('envoie une requete DELETE apres confirmation de suppression', async () => {
    mockFetchForTags();
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(<Tags />);

    await waitFor(() => {
      expect(screen.getByText('test')).toBeDefined();
    });

    const deleteButtons = screen.getAllByLabelText(/Supprimer/);
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      const fetchCalls = vi.mocked(globalThis.fetch).mock.calls;
      const deleteCall = fetchCalls.find(([url, opts]) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        return urlStr.includes('/api/tags/test') && (opts as RequestInit)?.method === 'DELETE';
      });
      expect(deleteCall).toBeDefined();
    });
  });

  it('affiche les checkboxes de selection pour la fusion', async () => {
    mockFetchForTags();
    renderWithProviders(<Tags />);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBe(3);
    });
  });

  it('affiche le bouton Fusionner quand au moins 2 tags sont selectionnes', async () => {
    mockFetchForTags();
    const user = userEvent.setup();
    renderWithProviders(<Tags />);

    await waitFor(() => {
      expect(screen.getByText('test')).toBeDefined();
    });

    // Aucun bouton fusionner au depart
    expect(screen.queryByText('Fusionner')).toBeNull();

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);

    await waitFor(() => {
      expect(screen.getByText('Fusionner')).toBeDefined();
    });
  });

  it('envoie une requete POST pour fusionner les tags', async () => {
    mockFetchForTags();
    const user = userEvent.setup();
    vi.spyOn(window, 'prompt').mockReturnValue('merged-tag');

    renderWithProviders(<Tags />);

    await waitFor(() => {
      expect(screen.getByText('test')).toBeDefined();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]); // test
    await user.click(checkboxes[1]); // projet

    const mergeButton = screen.getByText('Fusionner');
    await user.click(mergeButton);

    await waitFor(() => {
      const fetchCalls = vi.mocked(globalThis.fetch).mock.calls;
      const mergeCall = fetchCalls.find(([url, opts]) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        return urlStr.includes('/api/tags/merge') && (opts as RequestInit)?.method === 'POST';
      });
      expect(mergeCall).toBeDefined();
      if (mergeCall) {
        const body = JSON.parse((mergeCall[1] as RequestInit).body as string);
        expect(body.target).toBe('merged-tag');
        expect(body.sources).toContain('test');
        expect(body.sources).toContain('projet');
      }
    });
  });

  it('affiche "Aucun tag" quand la liste est vide', async () => {
    mockFetchForTags([], {});
    renderWithProviders(<Tags />);

    await waitFor(() => {
      expect(screen.getByText(/Aucun tag/)).toBeDefined();
    });
  });
});
