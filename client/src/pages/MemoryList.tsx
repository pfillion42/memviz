import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useMemories } from '../hooks/useMemories';
import { useSearch } from '../hooks/useSearch';
import { useVectorSearch } from '../hooks/useVectorSearch';
import { SearchBar } from '../components/SearchBar';
import { TagBadge } from '../components/TagBadge';
import { Pagination } from '../components/Pagination';
import type { Memory } from '../types';

const PAGE_SIZE = 20;

type SearchMode = 'fts' | 'vector';

interface MemoryWithSimilarity extends Memory {
  similarity?: number;
}

const toggleBtn = (active: boolean): React.CSSProperties => ({
  padding: '7px 14px',
  fontSize: '13px',
  fontWeight: 500,
  border: 'none',
  cursor: 'pointer',
  backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-elevated)',
  color: active ? 'white' : 'var(--text-secondary)',
  transition: 'all var(--transition-fast)',
});

export function MemoryList() {
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('fts');

  const isSearching = searchQuery.length >= 2;
  const memoriesQuery = useMemories({ limit: PAGE_SIZE, offset });
  const ftsResult = useSearch(searchQuery);
  const vectorResult = useVectorSearch(searchQuery);

  const searchResult = searchMode === 'vector' ? vectorResult : ftsResult;
  const activeQuery = isSearching ? searchResult : memoriesQuery;

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setOffset(0);
  }, []);

  if (activeQuery.isLoading) {
    return <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>;
  }

  if (activeQuery.isError) {
    return <p style={{ color: 'var(--error)' }}>Erreur lors du chargement des memoires.</p>;
  }

  const memories: MemoryWithSimilarity[] = activeQuery.data?.data ?? [];
  const total = isSearching ? memories.length : (memoriesQuery.data?.total ?? 0);
  const showSimilarity = isSearching && searchMode === 'vector';

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder={searchMode === 'vector' ? 'Recherche semantique...' : 'Rechercher dans les memoires...'}
          />
        </div>
        <div style={{
          display: 'flex',
          gap: '1px',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          border: '1px solid var(--border-default)',
        }}>
          <button
            onClick={() => setSearchMode('fts')}
            aria-label="Recherche texte"
            style={toggleBtn(searchMode === 'fts')}
          >
            Texte
          </button>
          <button
            onClick={() => setSearchMode('vector')}
            aria-label="Recherche vectorielle"
            style={toggleBtn(searchMode === 'vector')}
          >
            Vectoriel
          </button>
        </div>
      </div>

      {memories.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
          Aucune memoire trouvee.
        </p>
      ) : (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contenu</th>
                <th style={{ padding: '12px 16px', width: '90px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tags</th>
                {showSimilarity && <th style={{ padding: '12px 16px', width: '80px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score</th>}
                <th style={{ padding: '12px 16px', width: '140px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {memories.map((m) => (
                <tr
                  key={m.content_hash}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background-color var(--transition-fast)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <Link
                      to={`/memories/${m.content_hash}`}
                      style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '13px' }}
                    >
                      {m.content.length > 100 ? m.content.substring(0, 100) + '...' : m.content}
                    </Link>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {m.memory_type && (
                      <span style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 500,
                        backgroundColor: 'var(--info-dim)',
                        color: 'var(--info)',
                        borderRadius: 'var(--radius-sm)',
                      }}>
                        {m.memory_type}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div role="list">
                      {m.tags.map(tag => (
                        <TagBadge key={tag} tag={tag} />
                      ))}
                    </div>
                  </td>
                  {showSimilarity && (
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--success)' }}>
                      {m.similarity != null ? `${(m.similarity * 100).toFixed(0)}%` : '--'}
                    </td>
                  )}
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(m.created_at_iso).toLocaleDateString('fr-CA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isSearching && memoriesQuery.data && (
        <Pagination
          total={total}
          limit={PAGE_SIZE}
          offset={offset}
          onPageChange={setOffset}
        />
      )}
    </div>
  );
}
