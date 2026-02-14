import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../src/App';

beforeEach(() => {
  vi.restoreAllMocks();
  // Mock fetch pour eviter les erreurs reseau dans les tests
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: [], total: 0, limit: 20, offset: 0 }),
  } as Response);
});

describe('App', () => {
  it('affiche le composant principal', async () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeDefined();
  });

  it('affiche le titre memviz', () => {
    render(<App />);
    expect(screen.getByText('memviz')).toBeDefined();
  });

  it('affiche la navigation', () => {
    render(<App />);
    expect(screen.getByText('Memoires')).toBeDefined();
    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getByText('Graphe')).toBeDefined();
  });

  it('charge la page MemoryList par defaut', async () => {
    render(<App />);
    // MemoryList affiche "Chargement..." puis le contenu
    await waitFor(() => {
      // Apres chargement, on devrait voir le message "aucune memoire" ou le tableau
      expect(screen.getByLabelText('Recherche')).toBeDefined();
    });
  });
});
