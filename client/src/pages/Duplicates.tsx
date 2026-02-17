import { useState } from 'react';
import { useDuplicates } from '../hooks/useDuplicates';
import type { Memory } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

async function bulkDeleteMemories(hashes: string[]): Promise<void> {
  const res = await fetch('/api/memories/bulk-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hashes }),
  });
  if (!res.ok) throw new Error('Erreur lors de la suppression');
}

export function Duplicates() {
  const { t } = useLanguage();
  const [threshold, setThreshold] = useState(0.9);
  const [ignoredGroups, setIgnoredGroups] = useState<Set<string>>(new Set());
  const { data, isLoading, refetch } = useDuplicates({ threshold });

  const handleKeep = async (keepMemory: Memory, allMemories: Memory[]) => {
    const toDelete = allMemories
      .filter(m => m.content_hash !== keepMemory.content_hash)
      .map(m => m.content_hash);

    try {
      await bulkDeleteMemories(toDelete);
      await refetch();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleIgnore = (groupIndex: number) => {
    setIgnoredGroups(prev => new Set(prev).add(String(groupIndex)));
  };

  if (isLoading) {
    return <p style={{ color: 'var(--text-muted)' }}>{t('loading')}</p>;
  }

  const groups = data?.groups ?? [];
  const visibleGroups = groups.filter((_, idx) => !ignoredGroups.has(String(idx)));
  const totalGroups = data?.total_groups ?? 0;

  if (visibleGroups.length === 0) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('dup_title')}
            {totalGroups > 0 && (
              <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                ({t('dup_groups').replace('{count}', String(totalGroups))})
              </span>
            )}
          </h2>
        </div>

        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label htmlFor="threshold-slider" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {t('dup_threshold')}
          </label>
          <input
            id="threshold-slider"
            type="range"
            min="0.7"
            max="1"
            step="0.05"
            value={threshold}
            onChange={(e) => {
              setThreshold(parseFloat(e.target.value));
              setIgnoredGroups(new Set());
            }}
            style={{ flex: 1, maxWidth: '200px' }}
          />
          <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, minWidth: '40px' }}>
            {Math.round(threshold * 100)}%
          </span>
        </div>

        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
          {t('dup_none')}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {t('dup_title')}
          <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            ({t('dup_groups').replace('{count}', String(totalGroups))})
          </span>
        </h2>
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label htmlFor="threshold-slider" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {t('dup_threshold')}
        </label>
        <input
          id="threshold-slider"
          type="range"
          min="0.7"
          max="1"
          step="0.05"
          value={threshold}
          onChange={(e) => {
            setThreshold(parseFloat(e.target.value));
            setIgnoredGroups(new Set());
          }}
          style={{ flex: 1, maxWidth: '200px' }}
        />
        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, minWidth: '40px' }}>
          {Math.round(threshold * 100)}%
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {visibleGroups.map((group, groupIdx) => (
          <div
            key={groupIdx}
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: 'var(--accent-glow)',
                  color: 'var(--accent-primary-hover)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                {Math.round(group.similarity * 100)}%
              </div>
              <button
                onClick={() => handleIgnore(groupIdx)}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {t('dup_ignore')}
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '12px',
              }}
            >
              {group.memories.map((memory) => (
                <div
                  key={memory.content_hash}
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                  }}
                >
                  <div style={{ marginBottom: '8px', fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                    {memory.content.length > 200 ? memory.content.substring(0, 200) + '...' : memory.content}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {memory.memory_type && (
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-hover)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {memory.memory_type}
                      </span>
                    )}
                    {memory.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--accent-glow)',
                          color: 'var(--accent-primary-hover)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    {new Date(memory.created_at * 1000).toLocaleDateString('fr-CA')}
                  </div>

                  <button
                    onClick={() => handleKeep(memory, group.memories)}
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'white',
                      backgroundColor: 'var(--accent-primary)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--accent-primary-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                    }}
                  >
                    {t('dup_keep')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
