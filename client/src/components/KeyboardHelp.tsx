import { useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface KeyboardHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardHelp({ isOpen, onClose }: KeyboardHelpProps) {
  const { t } = useLanguage();

  const shortcuts = [
    { key: 'j', description: t('kb_next_line') },
    { key: 'k', description: t('kb_prev_line') },
    { key: '/', description: t('kb_focus_search') },
    { key: 'Enter', description: t('kb_open_detail') },
    { key: 'Escape', description: t('kb_close') },
    { key: '?', description: t('kb_show_help') },
  ];
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="keyboard-help-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          minWidth: '320px',
          maxWidth: '420px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <h3 style={{
          margin: '0 0 16px',
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}>
          {t('kb_title')}
        </h3>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {shortcuts.map(({ key, description }) => (
              <tr key={key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '8px 12px', width: '80px' }}>
                  <kbd style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    {key}
                  </kbd>
                </td>
                <td style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
