import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FilterPanel } from '../src/components/FilterPanel';
import type { MemoryFilters } from '../src/types';

const MOCK_STATS = {
  total: 42,
  byType: {
    note: 10,
    decision: 8,
    observation: 5,
  },
  byTag: {
    typescript: 15,
    express: 10,
  },
};

const MOCK_TAGS = {
  data: ['typescript', 'express', 'react', 'node'],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('FilterPanel', () => {
  it('affiche le bouton toggle Filtres', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_STATS),
    } as Response);

    const onApply = vi.fn();
    const filters: MemoryFilters = {};

    render(<FilterPanel filters={filters} onApply={onApply} />, { wrapper: createWrapper() });

    expect(screen.getByText('Filtres')).toBeDefined();
  });

  it('affiche le panneau quand on clique sur le bouton', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/memories/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_STATS),
        } as Response);
      }
      if (typeof url === 'string' && url.includes('/api/tags')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_TAGS),
        } as Response);
      }
      return Promise.reject(new Error('unknown url'));
    });

    const onApply = vi.fn();
    const filters: MemoryFilters = {};

    render(<FilterPanel filters={filters} onApply={onApply} />, { wrapper: createWrapper() });

    const toggleBtn = screen.getByText('Filtres');
    fireEvent.click(toggleBtn);

    // Le panneau doit apparaitre
    expect(screen.getByLabelText('Type')).toBeDefined();
    expect(screen.getByLabelText('Tags')).toBeDefined();
  });

  it('affiche les dropdowns type et tags', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/memories/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_STATS),
        } as Response);
      }
      if (typeof url === 'string' && url.includes('/api/tags')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_TAGS),
        } as Response);
      }
      return Promise.reject(new Error('unknown url'));
    });

    const onApply = vi.fn();
    const filters: MemoryFilters = {};

    render(<FilterPanel filters={filters} onApply={onApply} />, { wrapper: createWrapper() });

    const toggleBtn = screen.getByText('Filtres');
    fireEvent.click(toggleBtn);

    const typeSelect = screen.getByLabelText('Type') as HTMLSelectElement;
    expect(typeSelect).toBeDefined();

    const tagsContainer = screen.getByLabelText('Tags');
    expect(tagsContainer).toBeDefined();
  });

  it('appelle onApply avec les bons filtres quand on clique Appliquer', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/memories/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_STATS),
        } as Response);
      }
      if (typeof url === 'string' && url.includes('/api/tags')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_TAGS),
        } as Response);
      }
      return Promise.reject(new Error('unknown url'));
    });

    const onApply = vi.fn();
    const filters: MemoryFilters = {};

    render(<FilterPanel filters={filters} onApply={onApply} />, { wrapper: createWrapper() });

    const toggleBtn = screen.getByText('Filtres');
    fireEvent.click(toggleBtn);

    // Attendre que les donnees soient chargees
    await waitFor(() => {
      const typeSelect = screen.getByLabelText('Type') as HTMLSelectElement;
      expect(typeSelect.options.length).toBeGreaterThan(1);
    });

    const typeSelect = screen.getByLabelText('Type') as HTMLSelectElement;
    fireEvent.change(typeSelect, { target: { value: 'note' } });

    const applyBtn = screen.getByText('Appliquer');
    fireEvent.click(applyBtn);

    expect(onApply).toHaveBeenCalledWith({ type: 'note' });
  });

  it('reinitialise les filtres quand on clique Reinitialiser', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/memories/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_STATS),
        } as Response);
      }
      if (typeof url === 'string' && url.includes('/api/tags')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_TAGS),
        } as Response);
      }
      return Promise.reject(new Error('unknown url'));
    });

    const onApply = vi.fn();
    const filters: MemoryFilters = { type: 'note', tags: ['typescript'] };

    render(<FilterPanel filters={filters} onApply={onApply} />, { wrapper: createWrapper() });

    const toggleBtn = screen.getByText('Filtres');
    fireEvent.click(toggleBtn);

    const resetBtn = screen.getByText('Reinitialiser');
    fireEvent.click(resetBtn);

    expect(onApply).toHaveBeenCalledWith({});
  });
});
