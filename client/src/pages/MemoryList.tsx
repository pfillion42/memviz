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
    return <p>Chargement...</p>;
  }

  if (activeQuery.isError) {
    return <p>Erreur lors du chargement des memoires.</p>;
  }

  const memories: MemoryWithSimilarity[] = activeQuery.data?.data ?? [];
  const total = isSearching ? memories.length : (memoriesQuery.data?.total ?? 0);
  const showSimilarity = isSearching && searchMode === 'vector';

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder={searchMode === 'vector' ? 'Recherche semantique...' : 'Rechercher dans les memoires...'}
          />
        </div>
        <div style={{ display: 'flex', gap: '2px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #d1d5db' }}>
          <button
            onClick={() => setSearchMode('fts')}
            aria-label="Recherche texte"
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: searchMode === 'fts' ? '#2563eb' : '#f9fafb',
              color: searchMode === 'fts' ? 'white' : '#374151',
            }}
          >
            Texte
          </button>
          <button
            onClick={() => setSearchMode('vector')}
            aria-label="Recherche vectorielle"
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: searchMode === 'vector' ? '#2563eb' : '#f9fafb',
              color: searchMode === 'vector' ? 'white' : '#374151',
            }}
          >
            Vectoriel
          </button>
        </div>
      </div>

      {memories.length === 0 ? (
        <p>Aucune memoire trouvee.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
              <th style={{ padding: '8px' }}>Contenu</th>
              <th style={{ padding: '8px', width: '80px' }}>Type</th>
              <th style={{ padding: '8px' }}>Tags</th>
              {showSimilarity && <th style={{ padding: '8px', width: '80px' }}>Score</th>}
              <th style={{ padding: '8px', width: '160px' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {memories.map((m) => (
              <tr key={m.content_hash} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '8px' }}>
                  <Link
                    to={`/memories/${m.content_hash}`}
                    style={{ color: '#2563eb', textDecoration: 'none' }}
                  >
                    {m.content.length > 100 ? m.content.substring(0, 100) + '...' : m.content}
                  </Link>
                </td>
                <td style={{ padding: '8px' }}>
                  {m.memory_type && (
                    <span style={{
                      padding: '2px 6px',
                      fontSize: '12px',
                      backgroundColor: '#dbeafe',
                      borderRadius: '4px',
                    }}>
                      {m.memory_type}
                    </span>
                  )}
                </td>
                <td style={{ padding: '8px' }}>
                  <div role="list">
                    {m.tags.map(tag => (
                      <TagBadge key={tag} tag={tag} />
                    ))}
                  </div>
                </td>
                {showSimilarity && (
                  <td style={{ padding: '8px', fontSize: '13px', fontWeight: 600, color: '#16a34a' }}>
                    {m.similarity != null ? `${(m.similarity * 100).toFixed(0)}%` : '--'}
                  </td>
                )}
                <td style={{ padding: '8px', fontSize: '13px', color: '#6b7280' }}>
                  {new Date(m.created_at_iso).toLocaleDateString('fr-CA')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
