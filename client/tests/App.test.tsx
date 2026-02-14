import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('App', () => {
  it('affiche le composant principal', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeDefined();
  });

  it('affiche le titre memviz', () => {
    render(<App />);
    expect(screen.getByText('memviz')).toBeDefined();
  });
});
