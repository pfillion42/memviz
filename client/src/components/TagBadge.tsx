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
        padding: '2px 8px',
        margin: '2px',
        fontSize: '12px',
        backgroundColor: '#e5e7eb',
        color: '#374151',
        borderRadius: '9999px',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {tag}
    </span>
  );
}
