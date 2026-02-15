import { useState } from 'react';
import { QualityIndicator } from './QualityIndicator';
import { useRateMemory } from '../hooks/useMutations';

interface QualityVoterProps {
  hash: string;
  score?: number | null;
  compact?: boolean;
}

export function QualityVoter({ hash, score, compact = false }: QualityVoterProps) {
  const rateMutation = useRateMemory(hash);
  const [flashColor, setFlashColor] = useState<string | null>(null);

  function handleVote(vote: 'up' | 'down') {
    const color = vote === 'up' ? 'var(--success)' : 'var(--error)';
    setFlashColor(color);
    setTimeout(() => setFlashColor(null), 400);
    rateMutation.mutate(vote);
  }

  const btnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: compact ? '24px' : '28px',
    height: compact ? '24px' : '28px',
    fontSize: compact ? '12px' : '14px',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--bg-elevated)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    padding: 0,
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? '4px' : '6px',
        transition: 'background-color 0.3s ease',
        backgroundColor: flashColor ?? 'transparent',
        borderRadius: 'var(--radius-sm)',
        padding: '2px 4px',
      }}
    >
      <button
        onClick={(e) => { e.preventDefault(); handleVote('up'); }}
        disabled={rateMutation.isPending}
        aria-label="Vote up"
        style={btnStyle}
      >
        &#9650;
      </button>
      <QualityIndicator score={score} />
      <button
        onClick={(e) => { e.preventDefault(); handleVote('down'); }}
        disabled={rateMutation.isPending}
        aria-label="Vote down"
        style={btnStyle}
      >
        &#9660;
      </button>
    </span>
  );
}
