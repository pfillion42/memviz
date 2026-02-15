import type { UsageDataPoint } from '../types';

interface UsageChartProps {
  creations: UsageDataPoint[];
  accesses: UsageDataPoint[];
}

const SVG_WIDTH = 600;
const SVG_HEIGHT = 200;
const PADDING = { top: 16, right: 16, bottom: 36, left: 44 };

export function UsageChart({ creations, accesses }: UsageChartProps) {
  const allDates = Array.from(new Set([
    ...creations.map(c => c.date),
    ...accesses.map(a => a.date),
  ])).sort();

  const creationMap = new Map(creations.map(c => [c.date, c.count]));
  const accessMap = new Map(accesses.map(a => [a.date, a.count]));

  const maxCount = Math.max(
    1,
    ...creations.map(c => c.count),
    ...accesses.map(a => a.count),
  );

  const visibleDates = allDates.slice(-30);

  if (visibleDates.length === 0) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
        Aucune donnee disponible.
      </p>
    );
  }

  const plotW = SVG_WIDTH - PADDING.left - PADDING.right;
  const plotH = SVG_HEIGHT - PADDING.top - PADDING.bottom;

  function getX(i: number): number {
    if (visibleDates.length === 1) return PADDING.left + plotW / 2;
    return PADDING.left + (i / (visibleDates.length - 1)) * plotW;
  }

  function getY(count: number): number {
    return PADDING.top + plotH - (count / maxCount) * plotH;
  }

  function buildLine(dataMap: Map<string, number>): string {
    return visibleDates.map((date, i) => {
      const c = dataMap.get(date) || 0;
      return `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(c)}`;
    }).join(' ');
  }

  function buildArea(dataMap: Map<string, number>): string {
    const line = buildLine(dataMap);
    const baseY = PADDING.top + plotH;
    return `${line} L${getX(visibleDates.length - 1)},${baseY} L${getX(0)},${baseY} Z`;
  }

  // Graduations Y
  const yStep = Math.ceil(maxCount / 4) || 1;
  const yTicks: number[] = [];
  for (let v = 0; v <= maxCount; v += yStep) yTicks.push(v);
  if (yTicks[yTicks.length - 1] < maxCount) yTicks.push(maxCount);

  // Labels X : afficher max ~8 labels
  const xLabelStep = Math.max(1, Math.ceil(visibleDates.length / 8));

  function formatLabel(date: string): string {
    // YYYY-MM-DD -> MM-DD, YYYY-WXX -> WXX, YYYY-MM -> YYYY-MM
    if (date.includes('-W')) return date.slice(5);   // W06
    if (date.length === 10) return date.slice(5);    // 02-14
    return date;                                      // 2026-02
  }

  return (
    <div>
      {/* Legende */}
      <div data-testid="usage-legend" style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '12px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '20px', height: '3px', borderRadius: '2px',
            backgroundColor: 'var(--accent-primary)',
          }} />
          <span>Creations</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '20px', height: '3px', borderRadius: '2px',
            backgroundColor: 'var(--info)',
          }} />
          <span>Acces</span>
        </div>
      </div>

      {/* SVG line chart */}
      <svg
        data-testid="usage-line-chart"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        style={{ width: '100%', height: 'auto' }}
      >
        {/* Grille horizontale + labels Y (quantite) */}
        {yTicks.map(v => {
          const y = getY(v);
          return (
            <g key={`y-${v}`}>
              <line
                x1={PADDING.left} y1={y}
                x2={SVG_WIDTH - PADDING.right} y2={y}
                stroke="var(--border-default)" strokeWidth="1"
                strokeDasharray="4,4" opacity="0.5"
              />
              <text
                x={PADDING.left - 8} y={y + 4}
                textAnchor="end" fontSize="11"
                fill="var(--text-muted)"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* Axe X (bas) */}
        <line
          x1={PADDING.left} y1={PADDING.top + plotH}
          x2={SVG_WIDTH - PADDING.right} y2={PADDING.top + plotH}
          stroke="var(--border-default)" strokeWidth="1"
        />

        {/* Axe Y (gauche) */}
        <line
          x1={PADDING.left} y1={PADDING.top}
          x2={PADDING.left} y2={PADDING.top + plotH}
          stroke="var(--border-default)" strokeWidth="1"
        />

        {/* Aire sous les courbes */}
        <path d={buildArea(creationMap)} fill="var(--accent-primary)" opacity="0.12" />
        <path d={buildArea(accessMap)} fill="var(--info)" opacity="0.10" />

        {/* Ligne creations */}
        <path
          data-testid="line-creation"
          d={buildLine(creationMap)}
          fill="none" stroke="var(--accent-primary)"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />

        {/* Ligne acces */}
        <path
          data-testid="line-access"
          d={buildLine(accessMap)}
          fill="none" stroke="var(--info)"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />

        {/* Points */}
        {visibleDates.map((date, i) => {
          const cc = creationMap.get(date) || 0;
          const ac = accessMap.get(date) || 0;
          return (
            <g key={date}>
              {cc > 0 && (
                <circle
                  data-testid="point-creation"
                  cx={getX(i)} cy={getY(cc)} r="3.5"
                  fill="var(--accent-primary)" stroke="var(--bg-surface)" strokeWidth="1.5"
                >
                  <title>{`${date} — Creations: ${cc}`}</title>
                </circle>
              )}
              {ac > 0 && (
                <circle
                  data-testid="point-access"
                  cx={getX(i)} cy={getY(ac)} r="3.5"
                  fill="var(--info)" stroke="var(--bg-surface)" strokeWidth="1.5"
                >
                  <title>{`${date} — Acces: ${ac}`}</title>
                </circle>
              )}
            </g>
          );
        })}

        {/* Labels X (dates) */}
        {visibleDates.map((date, i) => {
          if (i % xLabelStep !== 0 && i !== visibleDates.length - 1) return null;
          return (
            <text
              key={`x-${date}`}
              x={getX(i)} y={PADDING.top + plotH + 20}
              textAnchor="middle" fontSize="11"
              fill="var(--text-muted)"
            >
              {formatLabel(date)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
