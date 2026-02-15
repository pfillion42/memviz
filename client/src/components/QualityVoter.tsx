import { useState } from 'react';
import { useRateMemory } from '../hooks/useMutations';

interface QualityVoterProps {
  hash: string;
  score?: number | null;
  compact?: boolean;
}

// Convertir score 0-1 en etoiles 1-5 (0.2=1, 0.4=2, ..., 1.0=5)
function scoreToStars(score: number | null | undefined): number {
  if (score == null) return 0;
  return Math.max(0, Math.min(5, Math.round(score * 5)));
}

// Convertir etoiles 1-5 en score 0-1
function starsToScore(stars: number): number {
  return stars / 5;
}

export function QualityVoter({ hash, score, compact = false }: QualityVoterProps) {
  const rateMutation = useRateMemory(hash);
  const [hoverStar, setHoverStar] = useState<number>(0);
  const currentStars = scoreToStars(score);

  function handleClick(star: number) {
    rateMutation.mutate(starsToScore(star));
  }

  const starSize = compact ? '14px' : '18px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '1px',
      }}
      onMouseLeave={() => setHoverStar(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = hoverStar > 0 ? star <= hoverStar : star <= currentStars;
        return (
          <button
            key={star}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClick(star); }}
            onMouseEnter={() => setHoverStar(star)}
            disabled={rateMutation.isPending}
            aria-label={`${star} etoile${star > 1 ? 's' : ''}`}
            title={`${star}/5`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0 1px',
              fontSize: starSize,
              color: filled ? 'var(--warning)' : 'var(--border-default)',
              transition: 'color 0.15s ease, transform 0.1s ease',
              transform: hoverStar === star ? 'scale(1.2)' : 'scale(1)',
              lineHeight: 1,
            }}
          >
            {filled ? '\u2605' : '\u2606'}
          </button>
        );
      })}
      {!compact && (
        <span style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          marginLeft: '6px',
          minWidth: '28px',
        }}>
          {currentStars > 0 ? `${currentStars}/5` : 'N/A'}
        </span>
      )}
    </span>
  );
}
