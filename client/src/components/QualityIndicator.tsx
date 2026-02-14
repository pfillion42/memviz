interface QualityIndicatorProps {
  score: number | undefined | null;
}

export function QualityIndicator({ score }: QualityIndicatorProps) {
  if (score == null) {
    return <span style={{ color: '#9ca3af' }}>--</span>;
  }

  const percent = Math.round(score * 100);
  const color = percent >= 70 ? '#16a34a' : percent >= 40 ? '#ca8a04' : '#dc2626';

  return (
    <span
      title={`Qualite : ${percent}%`}
      style={{ color, fontWeight: 600 }}
    >
      {percent}%
    </span>
  );
}
