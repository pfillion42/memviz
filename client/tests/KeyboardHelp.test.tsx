import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeyboardHelp } from '../src/components/KeyboardHelp';
import { LanguageProvider } from '../src/i18n/LanguageContext';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('KeyboardHelp', () => {
  it('affiche le modal quand isOpen est true', () => {
    render(<LanguageProvider><KeyboardHelp isOpen={true} onClose={() => {}} /></LanguageProvider>);
    expect(screen.getByText('Keyboard shortcuts')).toBeDefined();
  });

  it('ne rend rien quand isOpen est false', () => {
    render(<LanguageProvider><KeyboardHelp isOpen={false} onClose={() => {}} /></LanguageProvider>);
    expect(screen.queryByText('Keyboard shortcuts')).toBeNull();
  });

  it('affiche la liste des raccourcis', () => {
    render(<LanguageProvider><KeyboardHelp isOpen={true} onClose={() => {}} /></LanguageProvider>);
    expect(screen.getByText('j')).toBeDefined();
    expect(screen.getByText('k')).toBeDefined();
    expect(screen.getByText('/')).toBeDefined();
    expect(screen.getByText('Enter')).toBeDefined();
    expect(screen.getByText('Escape')).toBeDefined();
    expect(screen.getByText('?')).toBeDefined();
  });

  it('affiche les descriptions des raccourcis', () => {
    render(<LanguageProvider><KeyboardHelp isOpen={true} onClose={() => {}} /></LanguageProvider>);
    expect(screen.getByText(/Next line/)).toBeDefined();
    expect(screen.getByText(/Previous line/)).toBeDefined();
    expect(screen.getByText(/Focus search/)).toBeDefined();
    expect(screen.getByText(/Open detail/)).toBeDefined();
    expect(screen.getByText(/Close/)).toBeDefined();
    expect(screen.getByText(/Show this help/)).toBeDefined();
  });

  it('appelle onClose quand on presse Escape', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<LanguageProvider><KeyboardHelp isOpen={true} onClose={onClose} /></LanguageProvider>);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('appelle onClose quand on clique sur le fond', () => {
    const onClose = vi.fn();
    render(<LanguageProvider><KeyboardHelp isOpen={true} onClose={onClose} /></LanguageProvider>);

    const overlay = screen.getByTestId('keyboard-help-overlay');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ne ferme pas quand on clique sur le contenu du modal', () => {
    const onClose = vi.fn();
    render(<LanguageProvider><KeyboardHelp isOpen={true} onClose={onClose} /></LanguageProvider>);

    const content = screen.getByText('Keyboard shortcuts');
    fireEvent.click(content);
    expect(onClose).not.toHaveBeenCalled();
  });
});
