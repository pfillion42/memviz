import type { UsageDataPoint } from '../types';

interface UsageChartProps {
  creations: UsageDataPoint[];
  accesses: UsageDataPoint[];
}

const CHART_HEIGHT = 140;
const CHART_PADDING = { top: 10, right: 10, bottom: 30, left: 40 };

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

  // Limiter a 30 points visibles (les plus recents)
  const visibleDates = allDates.slice(-30);

  if (visibleDates.length === 0) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
        Aucune donnee disponible.
      </p>
    );
  }

  const drawWidth = 100 - CHART_PADDING.left - CHART_PADDING.right;
  const drawHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  // Calculer les positions X et Y pour chaque point
  function getX(i: number): number {
    if (visibleDates.length === 1) return CHART_PADDING.left + drawWidth / 2;
    return CHART_PADDING.left + (i / (visibleDates.length - 1)) * drawWidth;
  }

  function getY(count: number): number {
    return CHART_PADDING.top + drawHeight - (count / maxCount) * drawHeight;
  }

  // Construire les paths SVG pour les 2 series
  function buildPath(dataMap: Map<string, number>): string {
    return visibleDates.map((date, i) => {
      const count = dataMap.get(date) || 0;
      const x = getX(i);
      const y = getY(count);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }

  // Construire le path de l'aire sous la courbe
  function buildAreaPath(dataMap: Map<string, number>): string {
    const linePath = buildPath(dataMap);
    const lastX = getX(visibleDates.length - 1);
    const firstX = getX(0);
    const baseY = CHART_PADDING.top + drawHeight;
    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  }

  const creationPath = buildPath(creationMap);
  const accessPath = buildPath(accessMap);
  const creationAreaPath = buildAreaPath(creationMap);
  const accessAreaPath = buildAreaPath(accessMap);

  // Graduations Y (3-4 niveaux)
  const yTicks: number[] = [];
  const step = Math.ceil(maxCount / 3);
  for (let v = 0; v <= maxCount; v += step) {
    yTicks.push(v);
  }
  if (!yTicks.includes(maxCount)) yTicks.push(maxCount);

  // Labels X (afficher max ~6 labels pour eviter le chevauchement)
  const labelStep = Math.max(1, Math.floor(visibleDates.length / 6));

  return (
    <div>
      {/* Legende */}
      <div data-testid="usage-legend" style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '12px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '16px',
            height: '3px',
            borderRadius: '2px',
            background: 'var(--accent-primary)',
          }} />
          <span>Creations</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '16px',
            height: '3px',
            borderRadius: '2px',
            backgroundColor: 'var(--info)',
          }} />
          <span>Acces</span>
        </div>
      </div>

      {/* Line chart SVG */}
      <svg
        data-testid="usage-line-chart"
        viewBox={`0 0 100 ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: `${CHART_HEIGHT}px` }}
      >
        {/* Lignes de grille horizontales */}
        {yTicks.map(v => {
          const y = getY(v);
          return (
            <g key={`tick-${v}`}>
              <line
                x1={CHART_PADDING.left}
                y1={y}
                x2={CHART_PADDING.left + drawWidth}
                y2={y}
                stroke="var(--border-default)"
                strokeWidth="0.2"
                strokeDasharray="1,1"
              />
              <text
                x={CHART_PADDING.left - 2}
                y={y + 1.2}
                textAnchor="end"
                fontSize="3.5"
                fill="var(--text-muted)"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* Aire sous les courbes (fond transparent) */}
        <path
          d={creationAreaPath}
          fill="var(--accent-primary)"
          opacity="0.1"
        />
        <path
          d={accessAreaPath}
          fill="var(--info)"
          opacity="0.08"
        />

        {/* Ligne creations */}
        <path
          data-testid="line-creation"
          d={creationPath}
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth="0.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Ligne acces */}
        <path
          data-testid="line-access"
          d={accessPath}
          fill="none"
          stroke="var(--info)"
          strokeWidth="0.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points sur les courbes */}
        {visibleDates.map((date, i) => {
          const creationCount = creationMap.get(date) || 0;
          const accessCount = accessMap.get(date) || 0;
          return (
            <g key={date}>
              {creationCount > 0 && (
                <circle
                  data-testid="point-creation"
                  cx={getX(i)}
                  cy={getY(creationCount)}
                  r="0.8"
                  fill="var(--accent-primary)"
                >
                  <title>{`${date} - Creations: ${creationCount}`}</title>
                </circle>
              )}
              {accessCount > 0 && (
                <circle
                  data-testid="point-access"
                  cx={getX(i)}
                  cy={getY(accessCount)}
                  r="0.8"
                  fill="var(--info)"
                >
                  <title>{`${date} - Acces: ${accessCount}`}</title>
                </circle>
              )}
            </g>
          );
        })}

        {/* Labels X */}
        {visibleDates.map((date, i) => {
          if (i % labelStep !== 0 && i !== visibleDates.length - 1) return null;
          return (
            <text
              key={`label-${date}`}
              x={getX(i)}
              y={CHART_HEIGHT - 5}
              textAnchor="middle"
              fontSize="3"
              fill="var(--text-muted)"
            >
              {date.length > 7 ? date.slice(5) : date}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
