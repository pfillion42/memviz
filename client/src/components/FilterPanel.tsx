import { useState, useEffect } from 'react';
import { useStats, useTags } from '../hooks/useStats';
import type { MemoryFilters } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface FilterPanelProps {
  filters: MemoryFilters;
  onApply: (filters: MemoryFilters) => void;
}

export function FilterPanel({ filters, onApply }: FilterPanelProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<MemoryFilters>(filters);

  const statsQuery = useStats();
  const tagsQuery = useTags();

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const types = statsQuery.data?.byType ? Object.keys(statsQuery.data.byType) : [];
  const availableTags = tagsQuery.data?.data ?? [];

  const handleTypeChange = (value: string) => {
    setLocalFilters({ ...localFilters, type: value || undefined });
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = localFilters.tags ?? [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    setLocalFilters({ ...localFilters, tags: newTags });
  };

  const handleFromChange = (value: string) => {
    setLocalFilters({ ...localFilters, from: value || undefined });
  };

  const handleToChange = (value: string) => {
    setLocalFilters({ ...localFilters, to: value || undefined });
  };

  const handleQualityMinChange = (value: number) => {
    setLocalFilters({ ...localFilters, quality_min: value });
  };

  const handleQualityMaxChange = (value: number) => {
    setLocalFilters({ ...localFilters, quality_max: value });
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleReset = () => {
    const emptyFilters: MemoryFilters = {};
    setLocalFilters(emptyFilters);
    onApply(emptyFilters);
  };

  const toggleBtnStyle: React.CSSProperties = {
    padding: '7px 14px',
    fontSize: '13px',
    fontWeight: 500,
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    backgroundColor: isOpen ? 'var(--bg-active)' : 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    transition: 'all var(--transition-fast)',
  };

  const panelStyle: React.CSSProperties = {
    marginTop: '12px',
    padding: '16px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: '12px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '13px',
    backgroundColor: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    outline: 'none',
  };

  const checkboxContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  };

  const checkboxLabelStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    fontSize: '12px',
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  };

  const btnStyle: React.CSSProperties = {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  };

  const applyBtnStyle: React.CSSProperties = {
    ...btnStyle,
    background: 'var(--accent-gradient)',
    color: 'white',
    marginRight: '8px',
  };

  const resetBtnStyle: React.CSSProperties = {
    ...btnStyle,
    backgroundColor: 'var(--bg-elevated)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)',
  };

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)} style={toggleBtnStyle}>
        {t('filter_button')}
      </button>

      {isOpen && (
        <div style={panelStyle}>
          <div style={fieldStyle}>
            <label htmlFor="filter-type" style={labelStyle}>
              {t('type')}
            </label>
            <select
              id="filter-type"
              value={localFilters.type ?? ''}
              onChange={(e) => handleTypeChange(e.target.value)}
              aria-label="Type"
              style={inputStyle}
            >
              <option value="">{t('filter_all_types')}</option>
              {types.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle} aria-label="Tags">
              {t('tags')}
            </label>
            <div style={checkboxContainerStyle}>
              {availableTags.map(tag => {
                const isChecked = (localFilters.tags ?? []).includes(tag);
                return (
                  <label
                    key={tag}
                    style={{
                      ...checkboxLabelStyle,
                      backgroundColor: isChecked ? 'var(--accent-glow)' : 'var(--bg-elevated)',
                      borderColor: isChecked ? 'var(--accent-primary)' : 'var(--border-default)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTagToggle(tag)}
                      style={{ cursor: 'pointer' }}
                    />
                    {tag}
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label htmlFor="filter-from" style={labelStyle}>
                {t('filter_date_from')}
              </label>
              <input
                id="filter-from"
                type="date"
                value={localFilters.from ?? ''}
                onChange={(e) => handleFromChange(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="filter-to" style={labelStyle}>
                {t('filter_date_to')}
              </label>
              <input
                id="filter-to"
                type="date"
                value={localFilters.to ?? ''}
                onChange={(e) => handleToChange(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label htmlFor="filter-quality-min" style={labelStyle}>
                {t('filter_quality_min').replace('{value}', String(localFilters.quality_min ?? 0))}
              </label>
              <input
                id="filter-quality-min"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localFilters.quality_min ?? 0}
                onChange={(e) => handleQualityMinChange(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label htmlFor="filter-quality-max" style={labelStyle}>
                {t('filter_quality_max').replace('{value}', String(localFilters.quality_max ?? 1))}
              </label>
              <input
                id="filter-quality-max"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localFilters.quality_max ?? 1}
                onChange={(e) => handleQualityMaxChange(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleApply} style={applyBtnStyle}>
              {t('filter_apply')}
            </button>
            <button onClick={handleReset} style={resetBtnStyle}>
              {t('filter_reset')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
