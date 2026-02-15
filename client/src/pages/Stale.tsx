import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStaleMemories } from '../hooks/useStaleMemories';
import type { Memory } from '../types';

async function bulkDeleteMemories(hashes: string[]): Promise<void> {
  const res = await fetch('/api/memories/bulk-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hashes }),
  });
  if (!res.ok) throw new Error('Erreur lors de la suppression');
}

export function Stale() {
  const [days, setDays] = useState(90);
  const [qualityMax, setQualityMax] = useState(0.3);
  const { data, isLoading, refetch } = useStaleMemories(days, qualityMax);

  const handleDelete = async (hash: string) => {
    try {
      await bulkDeleteMemories([hash]);
      await refetch();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleDeleteAll = async () => {
    const hashes = data?.data.map(m => m.content_hash) ?? [];
    if (hashes.length === 0) return;

    if (!window.confirm(`Supprimer ${hashes.length} memoires obsoletes ?`)) {
      return;
    }

    try {
      await bulkDeleteMemories(hashes);
      await refetch();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  if (isLoading) {
    return <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>;
  }

  const memories = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Memoires obsoletes
          {total > 0 && (
            <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              ({total} memoires obsoletes)
            </span>
          )}
        </h2>

        {total > 0 && (
          <button
            onClick={handleDeleteAll}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--error)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--error)',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Tout supprimer
          </button>
        )}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label htmlFor="age-slider" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Age minimum (jours) :
          </label>
          <input
            id="age-slider"
            type="range"
            min="30"
            max="365"
            step="30"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            style={{ flex: 1, maxWidth: '200px' }}
          />
          <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, minWidth: '40px' }}>
            {days} j
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label htmlFor="quality-slider" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Qualite max :
          </label>
          <input
            id="quality-slider"
            type="range"
            min="0"
            max="0.5"
            step="0.05"
            value={qualityMax}
            onChange={(e) => setQualityMax(parseFloat(e.target.value))}
            style={{ flex: 1, maxWidth: '200px' }}
          />
          <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, minWidth: '40px' }}>
            {Math.round(qualityMax * 100)}%
          </span>
        </div>
      </div>

      {memories.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
          Aucune memoire obsolete trouvee.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {memories.map((memory: Memory) => (
            <div
              key={memory.content_hash}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: '6px',
                padding: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <Link
                    to={`/memories/${memory.content_hash}`}
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      display: 'block',
                      marginBottom: '6px',
                      lineHeight: '1.4',
                    }}
                  >
                    {memory.content.slice(0, 120)}
                    {memory.content.length > 120 && '...'}
                  </Link>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {memory.memory_type && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          background: 'var(--bg-base)',
                          padding: '2px 6px',
                          borderRadius: '3px',
                        }}
                      >
                        {memory.memory_type}
                      </span>
                    )}

                    {memory.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '11px',
                          color: 'var(--accent-primary)',
                          background: 'var(--bg-base)',
                          padding: '2px 6px',
                          borderRadius: '3px',
                        }}
                      >
                        {tag}
                      </span>
                    ))}

                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(memory.created_at * 1000).toLocaleDateString('fr-FR')}
                    </span>

                    {memory.metadata && typeof memory.metadata === 'object' && 'quality_score' in memory.metadata && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--warning)',
                          background: 'var(--bg-base)',
                          padding: '2px 6px',
                          borderRadius: '3px',
                        }}
                      >
                        Qualite: {Math.round((memory.metadata.quality_score as number) * 100)}%
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(memory.content_hash)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--error)',
                    background: 'transparent',
                    border: '1px solid var(--error)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
