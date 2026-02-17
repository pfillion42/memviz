import { useLanguage } from '../i18n/LanguageContext';

interface BulkActionBarProps {
  selectedHashes: string[];
  onDelete: () => void;
  onAddTag: (tag: string) => void;
  onChangeType: (type: string) => void;
  onClear: () => void;
}

export function BulkActionBar({
  selectedHashes,
  onDelete,
  onAddTag,
  onChangeType,
  onClear,
}: BulkActionBarProps) {
  const { t } = useLanguage();
  const count = selectedHashes.length;

  const handleDelete = () => {
    const confirmed = window.confirm(
      t('bulk_confirm_delete').replace('{count}', String(count))
    );
    if (confirmed) {
      onDelete();
    }
  };

  const handleAddTag = () => {
    const tag = window.prompt(t('bulk_prompt_tag'));
    if (tag && tag.trim()) {
      onAddTag(tag.trim());
    }
  };

  const handleChangeType = () => {
    const type = window.prompt(t('bulk_prompt_type'));
    if (type && type.trim()) {
      onChangeType(type.trim());
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--bg-elevated)',
        borderTop: '2px solid var(--accent-primary)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 1000,
      }}
    >
      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
        {(count > 1 ? t('bulk_selected_other') : t('bulk_selected_one')).replace('{count}', String(count))}
      </span>

      <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
        <button
          onClick={handleDelete}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            backgroundColor: 'var(--error)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          {t('delete')}
        </button>

        <button
          onClick={handleAddTag}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          {t('bulk_add_tag')}
        </button>

        <button
          onClick={handleChangeType}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            backgroundColor: 'var(--info)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          {t('bulk_change_type')}
        </button>

        <button
          onClick={onClear}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          {t('bulk_deselect')}
        </button>
      </div>
    </div>
  );
}
