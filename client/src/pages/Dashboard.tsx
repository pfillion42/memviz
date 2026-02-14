import { useState, useRef } from 'react';
import { useStats } from '../hooks/useStats';
import { useQueryClient } from '@tanstack/react-query';

export function Dashboard() {
  const statsQuery = useStats();
  const queryClient = useQueryClient();
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (statsQuery.isLoading) {
    return <p>Chargement...</p>;
  }

  if (statsQuery.isError || !statsQuery.data) {
    return <p>Erreur lors du chargement des statistiques.</p>;
  }

  const { total, byType, byTag } = statsQuery.data;

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
      setImportStatus('Erreur lors de l\'export.');
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
      setImportStatus(`Import termine : ${result.imported} importees, ${result.skipped} ignorees.`);
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    } catch {
      setImportStatus('Erreur lors de l\'import. Verifiez le format du fichier.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trier les tags par nombre decroissant
  const sortedTags = Object.entries(byTag).sort(([, a], [, b]) => b - a);
  const maxTagCount = sortedTags.length > 0 ? sortedTags[0][1] : 1;

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #bae6fd',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#0369a1' }}>{total}</div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Memoires totales</div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #bbf7d0',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#15803d' }}>
            {Object.keys(byType).length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Types distincts</div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: '#fefce8',
          borderRadius: '8px',
          border: '1px solid #fde68a',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#a16207' }}>
            {Object.keys(byTag).length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Tags uniques</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Repartition par type</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(byType).map(([type, count]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  padding: '2px 8px',
                  fontSize: '13px',
                  backgroundColor: '#dbeafe',
                  borderRadius: '4px',
                  minWidth: '80px',
                  textAlign: 'center',
                }}>
                  {type}
                </span>
                <div style={{
                  flex: 1,
                  height: '20px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(count / total) * 100}%`,
                    backgroundColor: '#3b82f6',
                    borderRadius: '4px',
                    minWidth: '2px',
                  }} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, minWidth: '30px' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Tags les plus utilises</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sortedTags.slice(0, 10).map(([tag, count]) => (
              <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '13px',
                  minWidth: '100px',
                  color: '#374151',
                }}>
                  {tag}
                </span>
                <div style={{
                  flex: 1,
                  height: '16px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(count / maxTagCount) * 100}%`,
                    backgroundColor: '#10b981',
                    borderRadius: '4px',
                    minWidth: '2px',
                  }} />
                </div>
                <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '20px' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Import / Export</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleExport}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Exporter (JSON)
          </button>
          <label style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}>
            Importer (JSON)
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
          <p style={{ marginTop: '8px', fontSize: '13px', color: '#374151' }}>{importStatus}</p>
        )}
      </div>
    </div>
  );
}
