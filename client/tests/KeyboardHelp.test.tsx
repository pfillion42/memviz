import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeyboardHelp } from '../src/components/KeyboardHelp';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('KeyboardHelp', () => {
  it('affiche le modal quand isOpen est true', () => {
    render(<KeyboardHelp isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Raccourcis clavier')).toBeDefined();
  });

  it('ne rend rien quand isOpen est false', () => {
    render(<KeyboardHelp isOpen={false} onClose={() => {}} />);
    expect(screen.queryByText('Raccourcis clavier')).toBeNull();
  });

  it('affiche la liste des raccourcis', () => {
    render(<KeyboardHelp isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('j')).toBeDefined();
    expect(screen.getByText('k')).toBeDefined();
    expect(screen.getByText('/')).toBeDefined();
    expect(screen.getByText('Enter')).toBeDefined();
    expect(screen.getByText('Escape')).toBeDefined();
    expect(screen.getByText('?')).toBeDefined();
  });

  it('affiche les descriptions des raccourcis', () => {
    render(<KeyboardHelp isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/Ligne suivante/)).toBeDefined();
    expect(screen.getByText(/Ligne precedente/)).toBeDefined();
    expect(screen.getByText(/Focus recherche/)).toBeDefined();
    expect(screen.getByText(/Ouvrir le detail/)).toBeDefined();
    expect(screen.getByText(/Fermer/)).toBeDefined();
    expect(screen.getByText(/Afficher cette aide/)).toBeDefined();
  });

  it('appelle onClose quand on presse Escape', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<KeyboardHelp isOpen={true} onClose={onClose} />);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('appelle onClose quand on clique sur le fond', () => {
    const onClose = vi.fn();
    render(<KeyboardHelp isOpen={true} onClose={onClose} />);

    const overlay = screen.getByTestId('keyboard-help-overlay');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ne ferme pas quand on clique sur le contenu du modal', () => {
    const onClose = vi.fn();
    render(<KeyboardHelp isOpen={true} onClose={onClose} />);

    const content = screen.getByText('Raccourcis clavier');
    fireEvent.click(content);
    expect(onClose).not.toHaveBeenCalled();
  });
});
