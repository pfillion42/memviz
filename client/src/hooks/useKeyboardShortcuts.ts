import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcutsOptions {
  onToggleHelp: () => void;
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tagName = el.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}

export function useKeyboardShortcuts({ onToggleHelp }: KeyboardShortcutsOptions) {
  const navigate = useNavigate();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isInputFocused()) return;

    switch (e.key) {
      case '/': {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('input[type="search"]');
        searchInput?.focus();
        break;
      }
      case '?': {
        onToggleHelp();
        break;
      }
      case 'Escape': {
        const searchInput = document.querySelector<HTMLInputElement>('input[type="search"]');
        if (document.activeElement === searchInput) {
          searchInput?.blur();
        }
        break;
      }
      case 'j': {
        const rows = document.querySelectorAll<HTMLTableRowElement>('tbody tr');
        if (rows.length === 0) break;
        const currentFocused = document.querySelector<HTMLTableRowElement>('tbody tr[data-focused="true"]');
        let nextIndex = 0;
        if (currentFocused) {
          currentFocused.removeAttribute('data-focused');
          currentFocused.style.borderLeft = '';
          const allRows = Array.from(rows);
          const currentIndex = allRows.indexOf(currentFocused);
          nextIndex = Math.min(currentIndex + 1, allRows.length - 1);
        }
        const nextRow = rows[nextIndex];
        if (nextRow) {
          nextRow.setAttribute('data-focused', 'true');
          nextRow.style.borderLeft = '3px solid var(--accent-primary)';
          nextRow.scrollIntoView({ block: 'nearest' });
        }
        break;
      }
      case 'k': {
        const rows = document.querySelectorAll<HTMLTableRowElement>('tbody tr');
        if (rows.length === 0) break;
        const currentFocused = document.querySelector<HTMLTableRowElement>('tbody tr[data-focused="true"]');
        let prevIndex = rows.length - 1;
        if (currentFocused) {
          currentFocused.removeAttribute('data-focused');
          currentFocused.style.borderLeft = '';
          const allRows = Array.from(rows);
          const currentIndex = allRows.indexOf(currentFocused);
          prevIndex = Math.max(currentIndex - 1, 0);
        }
        const prevRow = rows[prevIndex];
        if (prevRow) {
          prevRow.setAttribute('data-focused', 'true');
          prevRow.style.borderLeft = '3px solid var(--accent-primary)';
          prevRow.scrollIntoView({ block: 'nearest' });
        }
        break;
      }
      case 'Enter': {
        const focusedRow = document.querySelector<HTMLTableRowElement>('tbody tr[data-focused="true"]');
        if (focusedRow) {
          const link = focusedRow.querySelector<HTMLAnchorElement>('a[href]');
          if (link) {
            const href = link.getAttribute('href');
            if (href) navigate(href);
          }
        }
        break;
      }
    }
  }, [onToggleHelp, navigate]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
