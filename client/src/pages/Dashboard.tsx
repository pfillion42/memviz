import { useState, useRef } from 'react';
import { useStats } from '../hooks/useStats';
import { useUsageStats } from '../hooks/useUsageStats';
import { useQueryClient } from '@tanstack/react-query';
import { UsageChart } from '../components/UsageChart';
import type { UsagePeriod } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

const cardStyle = (borderColor: string): React.CSSProperties => ({
  padding: '24px',
  backgroundColor: 'var(--bg-surface)',
  borderRadius: 'var(--radius-lg)',
  border: `1px solid ${borderColor}`,
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
});

const statValue = (color: string): React.CSSProperties => ({
  fontSize: '36px',
  fontWeight: 700,
  color,
  lineHeight: 1,
});

export function Dashboard() {
  const { t } = useLanguage();
  const statsQuery = useStats();
  const queryClient = useQueryClient();
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [usagePeriod, setUsagePeriod] = useState<UsagePeriod>('day');
  const usageQuery = useUsageStats(usagePeriod);

  if (statsQuery.isLoading) {
    return <p style={{ color: 'var(--text-muted)' }}>{t('loading')}</p>;
  }

  if (statsQuery.isError || !statsQuery.data) {
    return <p style={{ color: 'var(--error)' }}>{t('dash_error_stats')}</p>;
  }

  const { total, byType, byTag, accessStats } = statsQuery.data;
  const safeAccessStats = accessStats || { totalAccesses: 0, avgAccesses: 0, topAccessed: [] };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/memories/export');
      if (!res.ok) throw new Error('Erreur export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memories-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setImportStatus(t('dash_error_export'));
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const res = await fetch('/api/memories/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Erreur import');

      const result = await res.json();
      setImportStatus(t('dash_import_result').replace('{imported}', String(result.imported)).replace('{skipped}', String(result.skipped)));
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    } catch {
      setImportStatus(t('dash_error_import'));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sortedTags = Object.entries(byTag).sort(([, a], [, b]) => b - a);
  const maxTagCount = sortedTags.length > 0 ? sortedTags[0][1] : 1;

  return (
    <div>
      {/* Stats cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <div style={cardStyle('var(--border-default)')}>
          <div style={statValue('var(--accent-primary-hover)')}>{total}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>{t('dash_total_memories')}</div>
        </div>

        <div style={cardStyle('var(--border-default)')}>
          <div style={statValue('var(--success)')}>
            {Object.keys(byType).length}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>{t('dash_distinct_types')}</div>
        </div>

        <div style={cardStyle('var(--border-default)')}>
          <div style={statValue('var(--warning)')}>
            {Object.keys(byTag).length}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>{t('dash_unique_tags')}</div>
        </div>

        <div style={cardStyle('var(--border-default)')}>
          <div style={statValue('var(--info)')}>
            {safeAccessStats.totalAccesses}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>{t('dash_total_accesses')}</div>
        </div>
      </div>

      {/* Charts section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Types distribution */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          padding: '20px',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
            {t('dash_type_distribution')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(byType).map(([type, count]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  padding: '3px 10px',
                  fontSize: '12px',
                  fontWeight: 500,
                  backgroundColor: 'var(--info-dim)',
                  color: 'var(--info)',
                  borderRadius: 'var(--radius-sm)',
                  minWidth: '85px',
                  textAlign: 'center',
                }}>
                  {type}
                </span>
                <div style={{
                  flex: 1,
                  height: '8px',
                  backgroundColor: 'var(--bg-hover)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(count / total) * 100}%`,
                    background: 'var(--accent-gradient)',
                    borderRadius: 'var(--radius-full)',
                    minWidth: '4px',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, minWidth: '30px', color: 'var(--text-secondary)' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top tags */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          padding: '20px',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
            {t('dash_top_tags')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sortedTags.slice(0, 10).map(([tag, count]) => (
              <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '12px',
                  minWidth: '100px',
                  color: 'var(--text-secondary)',
                  fontFamily: 'monospace',
                }}>
                  {tag}
                </span>
                <div style={{
                  flex: 1,
                  height: '6px',
                  backgroundColor: 'var(--bg-hover)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(count / maxTagCount) * 100}%`,
                    backgroundColor: 'var(--success)',
                    borderRadius: 'var(--radius-full)',
                    minWidth: '4px',
                    opacity: 0.7,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '20px' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top memoires consultees */}
      {safeAccessStats.topAccessed.length > 0 && (
        <div style={{
          marginTop: '24px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          padding: '20px',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
            {t('dash_top_accessed')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {safeAccessStats.topAccessed.map((mem) => (
              <div key={mem.content_hash} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '12px',
                  minWidth: '150px',
                  maxWidth: '250px',
                  color: 'var(--text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {mem.content}
                </span>
                <div style={{
                  flex: 1,
                  height: '6px',
                  backgroundColor: 'var(--bg-hover)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(mem.access_count / (safeAccessStats.topAccessed[0]?.access_count || 1)) * 100}%`,
                    backgroundColor: 'var(--info)',
                    borderRadius: 'var(--radius-full)',
                    minWidth: '4px',
                    opacity: 0.7,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '20px' }}>{mem.access_count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistiques d'utilisation */}
      <div style={{
        marginTop: '24px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        padding: '20px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            {t('dash_usage_stats')}
          </h3>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['day', 'week', 'month'] as UsagePeriod[]).map(p => (
              <button
                key={p}
                onClick={() => setUsagePeriod(p)}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  backgroundColor: usagePeriod === p ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                  color: usagePeriod === p ? 'white' : 'var(--text-secondary)',
                }}
              >
                {p === 'day' ? t('dash_period_day') : p === 'week' ? t('dash_period_week') : t('dash_period_month')}
              </button>
            ))}
          </div>
        </div>
        {usageQuery.isLoading && (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{t('loading')}</p>
        )}
        {usageQuery.isError && (
          <p style={{ color: 'var(--error)', fontSize: '13px' }}>{t('dash_error_loading')}</p>
        )}
        {usageQuery.data && (
          <UsageChart
            creations={usageQuery.data.creations}
            accesses={usageQuery.data.accesses}
          />
        )}
      </div>

      {/* Import/Export */}
      <div style={{
        marginTop: '24px',
        padding: '20px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
          {t('dash_import_export')}
        </h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleExport}
            style={{
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 500,
              background: 'var(--accent-gradient)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {t('dash_export_json')}
          </button>
          <label style={{
            padding: '9px 18px',
            fontSize: '13px',
            fontWeight: 500,
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}>
            {t('dash_import_json')}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        {importStatus && (
          <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>{importStatus}</p>
        )}
      </div>
    </div>
  );
}
