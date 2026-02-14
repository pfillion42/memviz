interface QualityIndicatorProps {
  score: number | undefined | null;
}

export function QualityIndicator({ score }: QualityIndicatorProps) {
  if (score == null) {
    return <span style={{ color: 'var(--text-muted)' }}>--</span>;
  }

  const percent = Math.round(score * 100);
  const color = percent >= 70 ? 'var(--success)' : percent >= 40 ? 'var(--warning)' : 'var(--error)';

  return (
    <span
      title={`Qualite : ${percent}%`}
      style={{ color, fontWeight: 600, fontSize: '13px' }}
    >
      {percent}%
    </span>
  );
}
