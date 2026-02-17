import { useState } from 'react';
import { useTags } from '../hooks/useStats';
import { useStats } from '../hooks/useStats';
import { useRenameTag, useDeleteTag, useMergeTags } from '../hooks/useTagActions';
import { useLanguage } from '../i18n/LanguageContext';

export function Tags() {
  const { t } = useLanguage();
  const { data: tagsData, isLoading: tagsLoading } = useTags();
  const { data: statsData, isLoading: statsLoading } = useStats();
  const renameTag = useRenameTag();
  const deleteTag = useDeleteTag();
  const mergeTags = useMergeTags();

  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  if (tagsLoading || statsLoading) {
    return <p style={{ color: 'var(--text-muted)' }}>{t('loading')}</p>;
  }

  const tags = tagsData?.data ?? [];
  const byTag = statsData?.byTag ?? {};

  // Trier par compteur decroissant
  const sortedTags = [...tags].sort((a, b) => (byTag[b] ?? 0) - (byTag[a] ?? 0));

  const handleStartRename = (tag: string) => {
    setEditingTag(tag);
    setEditValue(tag);
  };

  const handleConfirmRename = (originalTag: string) => {
    if (editValue && editValue !== originalTag) {
      renameTag.mutate({ tag: originalTag, newName: editValue });
    }
    setEditingTag(null);
  };

  const handleCancelRename = () => {
    setEditingTag(null);
    setEditValue('');
  };

  const handleDelete = (tag: string) => {
    if (window.confirm(t('tags_confirm_delete').replace('{tag}', tag))) {
      deleteTag.mutate(tag);
    }
  };

  const handleToggleSelect = (tag: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const handleMerge = () => {
    const target = window.prompt(t('tags_merge_prompt'));
    if (target) {
      mergeTags.mutate({ sources: Array.from(selectedTags), target });
      setSelectedTags(new Set());
    }
  };

  if (sortedTags.length === 0) {
    return (
      <div>
        <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {t('tags_title')}
        </h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
          {t('tags_empty')}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {t('tags_title')}
          <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            ({t('tags_count').replace('{count}', String(sortedTags.length))})
          </span>
        </h2>
        {selectedTags.size >= 2 && (
          <button
            onClick={handleMerge}
            style={{
              padding: '7px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'white',
              backgroundColor: 'var(--accent-primary)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--accent-primary-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--accent-primary)'; }}
          >
            {t('tags_merge')}
          </button>
        )}
      </div>

      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
              <th style={{ padding: '12px 16px', width: '40px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}></th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tag</th>
              <th style={{ padding: '12px 16px', width: '80px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('tags_col_uses')}</th>
              <th style={{ padding: '12px 16px', width: '120px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('tags_col_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedTags.map(tag => (
              <tr
                key={tag}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  transition: 'background-color var(--transition-fast)',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selectedTags.has(tag)}
                    onChange={() => handleToggleSelect(tag)}
                    aria-label={`Selectionner ${tag}`}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {editingTag === tag ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleConfirmRename(tag);
                        if (e.key === 'Escape') handleCancelRename();
                      }}
                      autoFocus
                      style={{
                        padding: '4px 8px',
                        fontSize: '13px',
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--accent-primary)',
                        borderRadius: 'var(--radius-sm)',
                        outline: 'none',
                      }}
                    />
                  ) : (
                    <span
                      data-testid="tag-name"
                      style={{
                        fontSize: '13px',
                        padding: '3px 10px',
                        backgroundColor: 'var(--accent-glow)',
                        color: 'var(--accent-primary-hover)',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 500,
                      }}
                    >
                      {tag}
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {byTag[tag] ?? 0}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <button
                      onClick={() => handleStartRename(tag)}
                      aria-label={`Renommer ${tag}`}
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {t('tags_rename')}
                    </button>
                    <button
                      onClick={() => handleDelete(tag)}
                      aria-label={`Supprimer ${tag}`}
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        color: 'var(--error)',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--error-dim)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--error-dim)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      X
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
