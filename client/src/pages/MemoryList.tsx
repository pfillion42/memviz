import { useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMemories } from '../hooks/useMemories';
import { useSearch } from '../hooks/useSearch';
import { useVectorSearch } from '../hooks/useVectorSearch';
import { SearchBar } from '../components/SearchBar';
import { FilterPanel } from '../components/FilterPanel';
import { TagBadge } from '../components/TagBadge';
import { Pagination } from '../components/Pagination';
import type { Memory, MemoryFilters } from '../types';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('fts');
  const [filters, setFilters] = useState<MemoryFilters>(() => {
    const initialFilters: MemoryFilters = {};
    const typeParam = searchParams.get('type');
    const tagsParam = searchParams.get('tags');
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const qualityMinParam = searchParams.get('quality_min');
    const qualityMaxParam = searchParams.get('quality_max');
    if (typeParam) initialFilters.type = typeParam;
    if (tagsParam) initialFilters.tags = tagsParam.split(',');
    if (fromParam) initialFilters.from = fromParam;
    if (toParam) initialFilters.to = toParam;
    if (qualityMinParam) initialFilters.quality_min = parseFloat(qualityMinParam);
    if (qualityMaxParam) initialFilters.quality_max = parseFloat(qualityMaxParam);
    return initialFilters;
  });

  const isSearching = searchQuery.length >= 2;
  const memoriesQuery = useMemories({ limit: PAGE_SIZE, offset, ...filters });
  const ftsResult = useSearch(searchQuery);
  const vectorResult = useVectorSearch(searchQuery);

  const searchResult = searchMode === 'vector' ? vectorResult : ftsResult;
  const activeQuery = isSearching ? searchResult : memoriesQuery;

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setOffset(0);
  }, []);

  const handleApplyFilters = useCallback((newFilters: MemoryFilters) => {
    setFilters(newFilters);
    setOffset(0);

    // Synchroniser avec l'URL
    const params = new URLSearchParams();
    if (newFilters.type) params.set('type', newFilters.type);
    if (newFilters.tags && newFilters.tags.length > 0) params.set('tags', newFilters.tags.join(','));
    if (newFilters.from) params.set('from', newFilters.from);
    if (newFilters.to) params.set('to', newFilters.to);
    if (newFilters.quality_min !== undefined) params.set('quality_min', String(newFilters.quality_min));
    if (newFilters.quality_max !== undefined) params.set('quality_max', String(newFilters.quality_max));

    setSearchParams(params);
  }, [setSearchParams]);

  // Compter les filtres actifs
  const countActiveFilters = () => {
    let count = 0;
    if (filters.type) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    if (filters.from) count++;
    if (filters.to) count++;
    if (filters.quality_min !== undefined && filters.quality_min > 0) count++;
    if (filters.quality_max !== undefined && filters.quality_max < 1) count++;
    return count;
  };

  const activeFiltersCount = countActiveFilters();

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
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px' }}>
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

      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FilterPanel filters={filters} onApply={handleApplyFilters} />
          {activeFiltersCount > 0 && (
            <span style={{
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              borderRadius: 'var(--radius-full)',
            }}>
              {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}
            </span>
          )}
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
