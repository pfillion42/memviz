interface TagBadgeProps {
  tag: string;
  onClick?: (tag: string) => void;
}

export function TagBadge({ tag, onClick }: TagBadgeProps) {
  return (
    <span
      role="listitem"
      onClick={() => onClick?.(tag)}
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        margin: '2px',
        fontSize: '11px',
        fontWeight: 500,
        backgroundColor: 'var(--accent-glow)',
        color: 'var(--accent-primary-hover)',
        borderRadius: 'var(--radius-full)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all var(--transition-fast)',
        letterSpacing: '0.02em',
      }}
    >
      {tag}
    </span>
  );
}
