import type { UsageDataPoint } from '../types';

interface UsageChartProps {
  creations: UsageDataPoint[];
  accesses: UsageDataPoint[];
}

export function UsageChart({ creations, accesses }: UsageChartProps) {
  // Fusionner toutes les dates uniques et trier par ordre ASC
  const allDates = Array.from(new Set([
    ...creations.map(c => c.date),
    ...accesses.map(a => a.date),
  ])).sort();

  // Construire les maps pour acces rapide
  const creationMap = new Map(creations.map(c => [c.date, c.count]));
  const accessMap = new Map(accesses.map(a => [a.date, a.count]));

  // Trouver le max pour calculer les hauteurs
  const maxCount = Math.max(
    1,
    ...creations.map(c => c.count),
    ...accesses.map(a => a.count),
  );

  // Limiter a 30 barres visibles (les plus recentes)
  const visibleDates = allDates.slice(-30);

  if (visibleDates.length === 0) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
        Aucune donnee disponible.
      </p>
    );
  }

  return (
    <div>
      {/* Legende */}
      <div data-testid="usage-legend" style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '16px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '2px',
            background: 'var(--accent-gradient, var(--accent-primary))',
          }} />
          <span>Creations</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '2px',
            backgroundColor: 'var(--info)',
          }} />
          <span>Acces</span>
        </div>
      </div>

      {/* Barres */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '4px',
        height: '120px',
        overflow: 'hidden',
      }}>
        {visibleDates.map(date => {
          const creationCount = creationMap.get(date) || 0;
          const accessCount = accessMap.get(date) || 0;
          const creationHeight = (creationCount / maxCount) * 100;
          const accessHeight = (accessCount / maxCount) * 100;

          return (
            <div key={date} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              minWidth: 0,
              height: '100%',
              justifyContent: 'flex-end',
            }}>
              <div style={{
                display: 'flex',
                gap: '1px',
                alignItems: 'flex-end',
                width: '100%',
                height: '100%',
              }}>
                {/* Barre creation */}
                <div
                  data-testid="bar-creation"
                  title={`Creations: ${creationCount}`}
                  style={{
                    flex: 1,
                    height: `${Math.max(creationHeight, creationCount > 0 ? 4 : 0)}%`,
                    background: 'var(--accent-gradient, var(--accent-primary))',
                    borderRadius: '2px 2px 0 0',
                    minHeight: creationCount > 0 ? '4px' : '0',
                    transition: 'height 0.3s ease',
                  }}
                />
                {/* Barre acces */}
                <div
                  data-testid="bar-access"
                  title={`Acces: ${accessCount}`}
                  style={{
                    flex: 1,
                    height: `${Math.max(accessHeight, accessCount > 0 ? 4 : 0)}%`,
                    backgroundColor: 'var(--info)',
                    borderRadius: '2px 2px 0 0',
                    minHeight: accessCount > 0 ? '4px' : '0',
                    opacity: 0.8,
                    transition: 'height 0.3s ease',
                  }}
                />
              </div>
              {/* Label date (abrege) */}
              <div style={{
                fontSize: '9px',
                color: 'var(--text-muted)',
                marginTop: '4px',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}>
                {date.length > 7 ? date.slice(5) : date}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
