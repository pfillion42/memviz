import { Link } from 'react-router-dom';
import { useTimeline } from '../hooks/useTimeline';
import { TagBadge } from '../components/TagBadge';

export function Timeline() {
  const { data, isLoading, isError } = useTimeline();

  if (isLoading) {
    return <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>;
  }

  if (isError) {
    return <p style={{ color: 'var(--error)' }}>Erreur lors du chargement de la timeline.</p>;
  }

  if (!data || data.groups.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
        <p>Aucune memoire dans la timeline.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
          Timeline
        </h2>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {data.total} memoire{data.total > 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ position: 'relative', paddingLeft: '24px' }}>
        {/* Ligne verticale continue */}
        <div style={{
          position: 'absolute',
          left: '7px',
          top: '0',
          bottom: '0',
          width: '2px',
          backgroundColor: 'var(--border-default)',
        }} />

        {data.groups.map((group) => (
          <div key={group.date} style={{ marginBottom: '32px', position: 'relative' }}>
            {/* Point sur la ligne */}
            <div style={{
              position: 'absolute',
              left: '-21px',
              top: '4px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-primary)',
              border: '2px solid var(--bg-base)',
            }} />

            {/* Header date */}
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '12px',
            }}>
              {group.date}
              <span style={{
                marginLeft: '8px',
                fontSize: '12px',
                fontWeight: 400,
                color: 'var(--text-muted)',
              }}>
                ({group.count})
              </span>
            </div>

            {/* Memoires du groupe */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {group.memories.map((m) => (
                <Link
                  key={m.content_hash}
                  to={`/memories/${m.content_hash}`}
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    padding: '12px 16px',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    {m.memory_type && (
                      <span style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 500,
                        backgroundColor: 'var(--info-dim)',
                        color: 'var(--info)',
                        borderRadius: 'var(--radius-sm)',
                      }}>
                        {m.memory_type}
                      </span>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {new Date(m.created_at_iso).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    lineHeight: 1.5,
                    marginBottom: m.tags.length > 0 ? '8px' : '0',
                  }}>
                    {m.content.length > 150 ? m.content.substring(0, 150) + '...' : m.content}
                  </div>
                  {m.tags.length > 0 && (
                    <div>
                      {m.tags.map((tag) => (
                        <TagBadge key={tag} tag={tag} />
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
