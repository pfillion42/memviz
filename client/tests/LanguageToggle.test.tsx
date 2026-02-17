import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../src/i18n/LanguageContext';
import App from '../src/App';

function wrapper({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

describe('Language Toggle', () => {
  beforeEach(() => {
    localStorage.clear();

    // Mock matchMedia pour useTheme
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Mock fetch pour App tests
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.includes('/api/memories/usage-stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ period: 'day', creations: [], accesses: [] }),
        } as Response);
      }
      if (urlStr.includes('/api/memories/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ total: 0, byType: {}, byTag: {} }),
        } as Response);
      }
      if (urlStr.includes('/api/tags')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [], total: 0, limit: 20, offset: 0 }),
      } as Response);
    });
  });

  describe('useLanguage hook', () => {
    it('retourne en par defaut sans localStorage', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });
      expect(result.current.language).toBe('en');
    });

    it('lit la langue depuis localStorage', () => {
      localStorage.setItem('memviz-language', 'fr');
      const { result } = renderHook(() => useLanguage(), { wrapper });
      expect(result.current.language).toBe('fr');
    });

    it('setLanguage change la langue et persiste', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });

      act(() => {
        result.current.setLanguage('fr');
      });

      expect(result.current.language).toBe('fr');
      expect(localStorage.getItem('memviz-language')).toBe('fr');
    });

    it('t() retourne la traduction anglaise par defaut', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });
      expect(result.current.t('nav_memories')).toBe('Memories');
    });

    it('t() retourne la traduction francaise apres changement', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });

      act(() => {
        result.current.setLanguage('fr');
      });

      expect(result.current.t('nav_memories')).toBe('Memoires');
    });

    it('bascule entre en et fr', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });

      expect(result.current.t('loading')).toBe('Loading...');

      act(() => {
        result.current.setLanguage('fr');
      });

      expect(result.current.t('loading')).toBe('Chargement...');

      act(() => {
        result.current.setLanguage('en');
      });

      expect(result.current.t('loading')).toBe('Loading...');
    });
  });

  describe('Language Toggle Button in App', () => {
    it('rend le bouton toggle langue dans le header', () => {
      render(<App />);
      const toggleButton = screen.getByRole('button', { name: /toggle language/i });
      expect(toggleButton).toBeDefined();
    });

    it('affiche FR quand la langue est en (pour switcher vers FR)', () => {
      render(<App />);
      const toggleButton = screen.getByRole('button', { name: /toggle language/i });
      expect(toggleButton.textContent).toBe('FR');
    });

    it('bascule la langue au clic', () => {
      render(<App />);
      const toggleButton = screen.getByRole('button', { name: /toggle language/i });

      // Langue initiale en -> bouton affiche FR
      expect(toggleButton.textContent).toBe('FR');

      // Clic -> passe en fr -> bouton affiche EN
      fireEvent.click(toggleButton);
      expect(toggleButton.textContent).toBe('EN');

      // Clic -> repasse en en -> bouton affiche FR
      fireEvent.click(toggleButton);
      expect(toggleButton.textContent).toBe('FR');
    });

    it('le texte de navigation change selon la langue', () => {
      render(<App />);

      // En anglais par defaut
      expect(screen.getByText('Memories')).toBeDefined();
      expect(screen.getByText('Duplicates')).toBeDefined();
      expect(screen.getByText('Graph')).toBeDefined();

      // Passer en francais
      const toggleButton = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(toggleButton);

      expect(screen.getByText('Memoires')).toBeDefined();
      expect(screen.getByText('Doublons')).toBeDefined();
      expect(screen.getByText('Graphe')).toBeDefined();
    });
  });
});
