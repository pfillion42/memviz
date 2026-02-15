import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageChart } from '../src/components/UsageChart';

const MOCK_CREATIONS = [
  { date: '2026-02-13', count: 1 },
  { date: '2026-02-14', count: 6 },
];

const MOCK_ACCESSES = [
  { date: '2026-02-13', count: 2 },
  { date: '2026-02-14', count: 3 },
];

describe('UsageChart', () => {
  it('affiche les barres de creation', () => {
    render(<UsageChart creations={MOCK_CREATIONS} accesses={MOCK_ACCESSES} />);
    const bars = screen.getAllByTestId('bar-creation');
    expect(bars.length).toBe(2);
  });

  it('affiche les barres d\'acces', () => {
    render(<UsageChart creations={MOCK_CREATIONS} accesses={MOCK_ACCESSES} />);
    const bars = screen.getAllByTestId('bar-access');
    expect(bars.length).toBe(2);
  });

  it('affiche la legende avec les 2 series', () => {
    render(<UsageChart creations={MOCK_CREATIONS} accesses={MOCK_ACCESSES} />);
    const legend = screen.getByTestId('usage-legend');
    expect(legend).toBeDefined();
    expect(screen.getByText('Creations')).toBeDefined();
    expect(screen.getByText('Acces')).toBeDefined();
  });

  it('gere des donnees vides', () => {
    render(<UsageChart creations={[]} accesses={[]} />);
    expect(screen.getByText(/aucune donnee/i)).toBeDefined();
  });
});
