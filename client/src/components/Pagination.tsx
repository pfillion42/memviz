import { useLanguage } from '../i18n/LanguageContext';

interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (offset: number) => void;
}

const btnStyle: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: '13px',
  fontWeight: 500,
  backgroundColor: 'var(--bg-elevated)',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
};

const btnDisabled: React.CSSProperties = {
  ...btnStyle,
  opacity: 0.4,
  cursor: 'not-allowed',
};

export function Pagination({ total, limit, offset, onPageChange }: PaginationProps) {
  const { t } = useLanguage();
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <nav aria-label="Pagination" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      marginTop: '20px',
    }}>
      <button
        disabled={currentPage <= 1}
        onClick={() => onPageChange(Math.max(0, offset - limit))}
        aria-label={t('page_aria_prev')}
        style={currentPage <= 1 ? btnDisabled : btnStyle}
      >
        {t('page_previous')}
      </button>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        {t('page_label')} <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{currentPage}</span> / {totalPages}
      </span>
      <button
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(offset + limit)}
        aria-label={t('page_aria_next')}
        style={currentPage >= totalPages ? btnDisabled : btnStyle}
      >
        {t('page_next')}
      </button>
    </nav>
  );
}
