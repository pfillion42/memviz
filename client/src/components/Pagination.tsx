interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (offset: number) => void;
}

export function Pagination({ total, limit, offset, onPageChange }: PaginationProps) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <nav aria-label="Pagination" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
      <button
        disabled={currentPage <= 1}
        onClick={() => onPageChange(Math.max(0, offset - limit))}
        aria-label="Page precedente"
        style={{ padding: '4px 12px', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer' }}
      >
        Precedent
      </button>
      <span>
        Page {currentPage} / {totalPages}
      </span>
      <button
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(offset + limit)}
        aria-label="Page suivante"
        style={{ padding: '4px 12px', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
      >
        Suivant
      </button>
    </nav>
  );
}
