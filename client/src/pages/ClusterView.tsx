import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClusters } from '../hooks/useClusters';
import { ScatterPlot } from '../components/ScatterPlot';
import type { ProjectionPoint } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

const CLUSTER_COLORS = [
  '#3b82f6', '#f59e0b', '#22c55e', '#a78bfa', '#f43f5e',
  '#6366f1', '#14b8a6', '#e879f9', '#fb923c', '#64748b',
];

export function ClusterView() {
  const { t } = useLanguage();
  const [threshold, setThreshold] = useState(0.6);
  const [minSize, setMinSize] = useState(2);
  const { data, isLoading, isError } = useClusters(threshold, minSize);
  const navigate = useNavigate();

  const handlePointClick = useCallback((hash: string) => {
    navigate(`/memories/${hash}`);
  }, [navigate]);

  // Construire les points pour le ScatterPlot et la colorMap
  const { points, colorMap } = useMemo(() => {
    if (!data || data.clusters.length === 0) return { points: [], colorMap: {} };

    const pts: ProjectionPoint[] = [];
    const cMap: Record<string, string> = {};

    for (const cluster of data.clusters) {
      const color = CLUSTER_COLORS[cluster.id % CLUSTER_COLORS.length];
      for (const mem of cluster.members) {
        pts.push({
          content_hash: mem.content_hash,
          x: cluster.centroid.x + (Math.random() - 0.5) * 0.5,
          y: cluster.centroid.y + (Math.random() - 0.5) * 0.5,
          content: mem.content.length > 100 ? mem.content.substring(0, 100) + '...' : mem.content,
          memory_type: mem.memory_type,
          tags: mem.tags,
          created_at_iso: mem.created_at_iso,
        });
        cMap[mem.content_hash] = color;
      }
    }

    return { points: pts, colorMap: cMap };
  }, [data]);

  if (isLoading) {
    return <p style={{ color: 'var(--text-muted)' }}>{t('loading')}</p>;
  }

  if (isError) {
    return <p style={{ color: 'var(--error)' }}>{t('cl_error')}</p>;
  }

  const clusters = data?.clusters ?? [];
  const totalClusters = data?.total_clusters ?? 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {t('cl_title')}
        </h2>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {t('cl_count').replace('{count}', String(totalClusters))}
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
          {t('cl_threshold')}
          <input
            type="range"
            min="0.3"
            max="0.9"
            step="0.05"
            value={threshold}
            onChange={e => setThreshold(parseFloat(e.target.value))}
            aria-label={t('cl_aria_threshold')}
            style={{ width: '100px' }}
          />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '32px' }}>{threshold.toFixed(2)}</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {t('cl_min_size')}
          <input
            type="range"
            min="2"
            max="10"
            step="1"
            value={minSize}
            onChange={e => setMinSize(parseInt(e.target.value))}
            aria-label={t('cl_aria_min_size')}
            style={{ width: '100px' }}
          />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '24px' }}>{minSize}</span>
        </label>
      </div>

      {/* Layout : ScatterPlot + liste */}
      {clusters.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
          {t('cl_empty')}
        </p>
      ) : (
        <div style={{ display: 'flex', gap: '16px' }}>
          {/* ScatterPlot a gauche (60%) */}
          <div style={{ flex: '0 0 60%' }}>
            <ScatterPlot
              points={points}
              onPointClick={handlePointClick}
              width={650}
              height={500}
              colorMap={colorMap}
            />
          </div>

          {/* Liste des clusters a droite (40%) */}
          <div style={{ flex: '1', overflow: 'auto', maxHeight: '500px' }}>
            {clusters.map(cluster => (
              <div
                key={cluster.id}
                style={{
                  padding: '12px 16px',
                  marginBottom: '8px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: CLUSTER_COLORS[cluster.id % CLUSTER_COLORS.length],
                      display: 'inline-block',
                    }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {cluster.label}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {t('cl_memories').replace('{count}', String(cluster.size))}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {t('cl_similarity')} {cluster.avg_similarity.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
