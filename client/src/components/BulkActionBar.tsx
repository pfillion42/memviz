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
  const count = selectedHashes.length;

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer ${count} memoire${count > 1 ? 's' : ''} ?`
    );
    if (confirmed) {
      onDelete();
    }
  };

  const handleAddTag = () => {
    const tag = window.prompt('Entrez le tag a ajouter :');
    if (tag && tag.trim()) {
      onAddTag(tag.trim());
    }
  };

  const handleChangeType = () => {
    const type = window.prompt('Entrez le nouveau type :');
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
        {count} memoire{count > 1 ? 's' : ''} selectionnee{count > 1 ? 's' : ''}
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
          Supprimer
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
          Ajouter tag
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
          Changer type
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
          Deselectionner tout
        </button>
      </div>
    </div>
  );
}
