import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { QualityVoter } from '../src/components/QualityVoter';

function renderVoter(props: { hash: string; score?: number | null; compact?: boolean }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <QualityVoter hash={props.hash} score={props.score} compact={props.compact} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('QualityVoter', () => {
  it('affiche 5 boutons etoiles', () => {
    renderVoter({ hash: 'hash_aaa', score: 0.6 });
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('affiche le score N/A quand score est null', () => {
    renderVoter({ hash: 'hash_aaa', score: null });
    expect(screen.getByText('N/A')).toBeDefined();
  });

  it('affiche le score en etoiles (0.6 = 3/5)', () => {
    renderVoter({ hash: 'hash_aaa', score: 0.6 });
    expect(screen.getByText('3/5')).toBeDefined();
  });

  it('affiche le score en etoiles (1.0 = 5/5)', () => {
    renderVoter({ hash: 'hash_aaa', score: 1.0 });
    expect(screen.getByText('5/5')).toBeDefined();
  });

  it('envoie score 0.6 au clic sur la 3e etoile', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ quality_score: 0.6 }),
    } as Response);

    renderVoter({ hash: 'hash_aaa', score: 0.4 });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /3 etoiles/i }));

    await waitFor(() => {
      const calls = fetchSpy.mock.calls;
      const rateCall = calls.find((c) => {
        const url = typeof c[0] === 'string' ? c[0] : (c[0] as Request).url;
        return url.includes('/api/memories/hash_aaa/rate');
      });
      expect(rateCall).toBeDefined();
      const opts = rateCall![1] as RequestInit;
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body as string)).toEqual({ score: 0.6 });
    });
  });

  it('masque le label score en mode compact', () => {
    renderVoter({ hash: 'hash_aaa', score: 0.8, compact: true });
    expect(screen.queryByText('4/5')).toBeNull();
  });
});
