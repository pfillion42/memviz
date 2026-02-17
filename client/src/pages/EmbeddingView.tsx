import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjection } from '../hooks/useProjection';
import { ScatterPlot } from '../components/ScatterPlot';
import { useLanguage } from '../i18n/LanguageContext';

const TYPE_COLORS: Record<string, string> = {
  note: '#3b82f6',
  decision: '#f59e0b',
  observation: '#22c55e',
  fact: '#a78bfa',
  reminder: '#f43f5e',
  document: '#6366f1',
};

export function EmbeddingView() {
  const { t } = useLanguage();
  const [nNeighbors, setNNeighbors] = useState(15);
  const [minDist, setMinDist] = useState(0.1);
  const { data, isLoading, isError } = useProjection(nNeighbors, minDist);
  const navigate = useNavigate();

  const handlePointClick = useCallback((hash: string) => {
    navigate(`/memories/${hash}`);
  }, [navigate]);

  if (isLoading) {
    return <p style={{ color: 'var(--text-muted)' }}>{t('loading')}</p>;
  }

  if (isError) {
    return <p style={{ color: 'var(--error)' }}>{t('emb_error')}</p>;
  }

  const points = data?.points ?? [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {t('emb_title')}
        </h2>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {t('emb_points').replace('{count}', String(points.length))}
        </span>
      </div>

      {/* Controles */}
      <div style={{
        display: 'flex',
        gap: '24px',
        marginBottom: '16px',
        padding: '12px 16px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {t('emb_neighbors')}
          <input
            type="range"
            min="2"
            max="50"
            value={nNeighbors}
            onChange={e => setNNeighbors(parseInt(e.target.value))}
            aria-label={t('emb_aria_neighbors')}
            style={{ width: '100px' }}
          />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '24px' }}>{nNeighbors}</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {t('emb_min_dist')}
          <input
            type="range"
            min="0.01"
            max="1.0"
            step="0.01"
            value={minDist}
            onChange={e => setMinDist(parseFloat(e.target.value))}
            aria-label={t('emb_aria_min_dist')}
            style={{ width: '100px' }}
          />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '32px' }}>{minDist.toFixed(2)}</span>
        </label>
      </div>

      {/* Legende */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: color,
              display: 'inline-block',
              boxShadow: `0 0 6px ${color}60`,
            }} />
            {type}
          </span>
        ))}
      </div>

      {/* Scatter plot ou message vide */}
      {points.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
          {t('emb_empty')}
        </p>
      ) : (
        <ScatterPlot
          points={points}
          onPointClick={handlePointClick}
          width={1100}
          height={500}
        />
      )}
    </div>
  );
}
