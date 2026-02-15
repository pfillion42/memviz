import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import App from '../src/App';
import { useTheme } from '../src/hooks/useTheme';

describe('Theme Toggle', () => {
  beforeEach(() => {
    // Nettoyer localStorage avant chaque test
    localStorage.clear();

    // Reset document.documentElement.dataset.theme
    delete document.documentElement.dataset.theme;

    // Mock matchMedia pour la preference systeme
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
  });

  describe('useTheme hook', () => {
    it('applique le theme dark par defaut sans localStorage', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    it('lit le theme depuis localStorage', () => {
      localStorage.setItem('memviz-theme', 'light');

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('light');
      expect(document.documentElement.dataset.theme).toBe('light');
    });

    it('bascule entre dark et light avec toggleTheme', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('dark');

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
      expect(document.documentElement.dataset.theme).toBe('light');
      expect(localStorage.getItem('memviz-theme')).toBe('light');

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.dataset.theme).toBe('dark');
      expect(localStorage.getItem('memviz-theme')).toBe('dark');
    });

    it('definit le theme avec setTheme', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(document.documentElement.dataset.theme).toBe('light');
      expect(localStorage.getItem('memviz-theme')).toBe('light');
    });

    it('persiste le theme dans localStorage', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('light');
      });

      expect(localStorage.getItem('memviz-theme')).toBe('light');

      // Simuler un nouveau rendu (rechargement page)
      const { result: result2 } = renderHook(() => useTheme());

      expect(result2.current.theme).toBe('light');
    });

    it('respecte la preference systeme si pas de choix enregistre', () => {
      // Mock preference systeme light
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: light)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('light');
    });
  });

  describe('Theme Toggle Button in App', () => {
    it('rend le bouton toggle dans le header', () => {
      // App contient deja BrowserRouter, pas besoin d'en ajouter un
      render(<App />);

      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      expect(toggleButton).toBeDefined();
    });

    it('bascule le theme au clic sur le bouton', async () => {
      // App contient deja BrowserRouter, pas besoin d'en ajouter un
      render(<App />);

      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });

      // Theme initial dark
      expect(document.documentElement.dataset.theme).toBe('dark');

      // Clic pour passer en light
      fireEvent.click(toggleButton);
      expect(document.documentElement.dataset.theme).toBe('light');

      // Clic pour revenir en dark
      fireEvent.click(toggleButton);
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    it('affiche une icone soleil en mode dark et lune en mode light', () => {
      // App contient deja BrowserRouter, pas besoin d'en ajouter un
      render(<App />);

      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });

      // En mode dark, doit afficher l'icone soleil
      expect(toggleButton.textContent).toContain('☀');

      // Passer en mode light
      fireEvent.click(toggleButton);

      // En mode light, doit afficher l'icone lune
      expect(toggleButton.textContent).toContain('☾');
    });
  });
});
