import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../src/App';

beforeEach(() => {
  vi.restoreAllMocks();
  // Mock fetch pour eviter les erreurs reseau dans les tests
  vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    if (urlStr.includes('/api/memories/stats')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ total: 0, byType: {}, byTag: {} }),
      } as Response);
    }
    if (urlStr.includes('/api/memories/timeline')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ groups: [], total: 0 }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: [], total: 0, limit: 20, offset: 0 }),
    } as Response);
  });
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
    expect(screen.getByText('Timeline')).toBeDefined();
    expect(screen.getByText('Doublons')).toBeDefined();
    expect(screen.getByText('Graphe')).toBeDefined();
  });

  it('charge le Dashboard par defaut', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Memoires totales')).toBeDefined();
    });
  });
});
