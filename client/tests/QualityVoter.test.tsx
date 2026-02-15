import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { QualityVoter } from '../src/components/QualityVoter';

function renderVoter(props: { hash: string; score?: number | null }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <QualityVoter hash={props.hash} score={props.score} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('QualityVoter', () => {
  it('affiche le score via QualityIndicator', () => {
    renderVoter({ hash: 'hash_aaa', score: 0.85 });
    expect(screen.getByText('85%')).toBeDefined();
  });

  it('affiche -- quand le score est null', () => {
    renderVoter({ hash: 'hash_aaa', score: null });
    expect(screen.getByText('--')).toBeDefined();
  });

  it('affiche les boutons vote up et vote down', () => {
    renderVoter({ hash: 'hash_aaa', score: 0.5 });
    expect(screen.getByRole('button', { name: /vote up/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /vote down/i })).toBeDefined();
  });

  it('appelle POST /api/memories/:hash/rate avec up au clic sur vote up', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ quality_score: 0.9 }),
    } as Response);

    renderVoter({ hash: 'hash_aaa', score: 0.5 });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /vote up/i }));

    await waitFor(() => {
      const calls = fetchSpy.mock.calls;
      const rateCall = calls.find((c) => {
        const url = typeof c[0] === 'string' ? c[0] : (c[0] as Request).url;
        return url.includes('/api/memories/hash_aaa/rate');
      });
      expect(rateCall).toBeDefined();
      const opts = rateCall![1] as RequestInit;
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body as string)).toEqual({ vote: 'up' });
    });
  });

  it('appelle POST /api/memories/:hash/rate avec down au clic sur vote down', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ quality_score: 0.3 }),
    } as Response);

    renderVoter({ hash: 'hash_aaa', score: 0.5 });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /vote down/i }));

    await waitFor(() => {
      const calls = fetchSpy.mock.calls;
      const rateCall = calls.find((c) => {
        const url = typeof c[0] === 'string' ? c[0] : (c[0] as Request).url;
        return url.includes('/api/memories/hash_aaa/rate');
      });
      expect(rateCall).toBeDefined();
      const opts = rateCall![1] as RequestInit;
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body as string)).toEqual({ vote: 'down' });
    });
  });
});
