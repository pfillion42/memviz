import { useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMemories } from '../hooks/useMemories';
import { useSearch } from '../hooks/useSearch';
import { useVectorSearch } from '../hooks/useVectorSearch';
import { useBulkDelete, useBulkTag, useBulkType } from '../hooks/useBulkActions';
import { SearchBar } from '../components/SearchBar';
import { FilterPanel } from '../components/FilterPanel';
import { TagBadge } from '../components/TagBadge';
import { Pagination } from '../components/Pagination';
import { BulkActionBar } from '../components/BulkActionBar';
import { QualityVoter } from '../components/QualityVoter';
import { useLanguage } from '../i18n/LanguageContext';
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
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('fts');
  const [selectedHashes, setSelectedHashes] = useState<Set<string>>(new Set());
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
  const bulkDelete = useBulkDelete();
  const bulkTag = useBulkTag();
  const bulkType = useBulkType();

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

  const toggleSelectHash = useCallback((hash: string) => {
    setSelectedHashes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(hash)) {
        newSet.delete(hash);
      } else {
        newSet.add(hash);
      }
      return newSet;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedHashes(new Set());
  }, []);

  if (activeQuery.isLoading) {
    return <p style={{ color: 'var(--text-muted)' }}>{t('loading')}</p>;
  }

  if (activeQuery.isError) {
    return <p style={{ color: 'var(--error)' }}>{t('ml_error')}</p>;
  }

  const memories: MemoryWithSimilarity[] = activeQuery.data?.data ?? [];
  const total = isSearching ? memories.length : (memoriesQuery.data?.total ?? 0);
  const showSimilarity = isSearching && searchMode === 'vector';

  const toggleSelectAll = () => {
    if (selectedHashes.size === memories.length && memories.length > 0) {
      setSelectedHashes(new Set());
    } else {
      setSelectedHashes(new Set(memories.map((m) => m.content_hash)));
    }
  };

  const handleBulkDelete = async () => {
    await bulkDelete.mutateAsync({ hashes: Array.from(selectedHashes) });
    setSelectedHashes(new Set());
  };

  const handleBulkAddTag = async (tag: string) => {
    await bulkTag.mutateAsync({ hashes: Array.from(selectedHashes), add_tags: [tag] });
    setSelectedHashes(new Set());
  };

  const handleBulkChangeType = async (type: string) => {
    await bulkType.mutateAsync({ hashes: Array.from(selectedHashes), memory_type: type });
    setSelectedHashes(new Set());
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder={searchMode === 'vector' ? t('ml_search_semantic') : t('ml_search_text')}
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
            aria-label={t('ml_aria_text_search')}
            style={toggleBtn(searchMode === 'fts')}
          >
            {t('ml_mode_text')}
          </button>
          <button
            onClick={() => setSearchMode('vector')}
            aria-label={t('ml_aria_vector_search')}
            style={toggleBtn(searchMode === 'vector')}
          >
            {t('ml_mode_vector')}
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
              {(activeFiltersCount > 1 ? t('ml_filter_count_other') : t('ml_filter_count_one')).replace('{count}', String(activeFiltersCount))}
            </span>
          )}
        </div>
      </div>

      {memories.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
          {t('ml_no_results')}
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
                <th style={{ padding: '12px 16px', width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selectedHashes.size === memories.length && memories.length > 0}
                    onChange={toggleSelectAll}
                    aria-label={t('ml_select_all')}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ml_col_content')}</th>
                <th style={{ padding: '12px 16px', width: '90px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('type')}</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('tags')}</th>
                <th style={{ padding: '12px 16px', width: '110px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ml_col_quality')}</th>
                {showSimilarity && <th style={{ padding: '12px 16px', width: '80px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ml_col_score')}</th>}
                <th style={{ padding: '12px 16px', width: '140px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ml_col_date')}</th>
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
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedHashes.has(m.content_hash)}
                      onChange={() => toggleSelectHash(m.content_hash)}
                      aria-label={`Selectionner ${m.content_hash}`}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
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
                  <td style={{ padding: '12px 16px' }}>
                    <QualityVoter
                      hash={m.content_hash}
                      score={(m.metadata as Record<string, unknown> | null)?.quality_score as number | undefined}
                      compact
                    />
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

      {selectedHashes.size > 0 && (
        <BulkActionBar
          selectedHashes={Array.from(selectedHashes)}
          onDelete={handleBulkDelete}
          onAddTag={handleBulkAddTag}
          onChangeType={handleBulkChangeType}
          onClear={handleClearSelection}
        />
      )}
    </div>
  );
}
