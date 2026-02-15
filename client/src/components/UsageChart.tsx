import type { UsageDataPoint } from '../types';

interface UsageChartProps {
  creations: UsageDataPoint[];
  accesses: UsageDataPoint[];
}

interface Point { x: number; y: number }

const SVG_WIDTH = 600;
const SVG_HEIGHT = 200;
const PADDING = { top: 16, right: 16, bottom: 36, left: 44 };

// Interpolation cubique monotone (Fritsch-Carlson)
// Garantit que la courbe ne depasse jamais les valeurs des points
function buildMonotonePath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  if (points.length === 2) return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;

  const n = points.length;

  // 1. Pentes entre segments (delta)
  const dx: number[] = [];
  const dy: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1].x - points[i].x);
    dy.push(points[i + 1].y - points[i].y);
    slope.push(dx[i] === 0 ? 0 : dy[i] / dx[i]);
  }

  // 2. Tangentes aux points (Fritsch-Carlson)
  const m: number[] = new Array(n);
  m[0] = slope[0];
  m[n - 1] = slope[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) {
      // Changement de direction -> tangente nulle (pas d'overshoot)
      m[i] = 0;
    } else {
      m[i] = (slope[i - 1] + slope[i]) / 2;
    }
  }

  // 3. Ajustement monotone : limiter les tangentes
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const alpha = m[i] / slope[i];
      const beta = m[i + 1] / slope[i];
      // Limiter pour rester dans le cercle de rayon 3
      const s = alpha * alpha + beta * beta;
      if (s > 9) {
        const t = 3 / Math.sqrt(s);
        m[i] = t * alpha * slope[i];
        m[i + 1] = t * beta * slope[i];
      }
    }
  }

  // 4. Construire le path SVG avec des courbes de Bezier cubiques
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const seg = dx[i] / 3;
    const cp1x = points[i].x + seg;
    const cp1y = points[i].y + m[i] * seg;
    const cp2x = points[i + 1].x - seg;
    const cp2y = points[i + 1].y - m[i + 1] * seg;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i + 1].x},${points[i + 1].y}`;
  }

  return d;
}

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

  function getPoints(dataMap: Map<string, number>): Point[] {
    return visibleDates.map((date, i) => ({
      x: getX(i),
      y: getY(dataMap.get(date) || 0),
    }));
  }

  function buildSplineArea(dataMap: Map<string, number>): string {
    const spline = buildMonotonePath(getPoints(dataMap));
    const baseY = PADDING.top + plotH;
    const lastX = getX(visibleDates.length - 1);
    const firstX = getX(0);
    return `${spline} L${lastX},${baseY} L${firstX},${baseY} Z`;
  }

  // Graduations Y
  const yStep = Math.ceil(maxCount / 4) || 1;
  const yTicks: number[] = [];
  for (let v = 0; v <= maxCount; v += yStep) yTicks.push(v);
  if (yTicks[yTicks.length - 1] < maxCount) yTicks.push(maxCount);

  // Labels X : afficher max ~8 labels
  const xLabelStep = Math.max(1, Math.ceil(visibleDates.length / 8));

  function formatLabel(date: string): string {
    // "2026-02-14 16:00" -> "16h" (horaire)
    if (date.includes(' ')) return date.split(' ')[1].replace(':00', 'h');
    // "2026-02-14" -> "02-14" (journalier)
    if (date.length === 10) return date.slice(5);
    return date;
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
        <path d={buildSplineArea(creationMap)} fill="var(--accent-primary)" opacity="0.12" />
        <path d={buildSplineArea(accessMap)} fill="var(--info)" opacity="0.10" />

        {/* Courbe creations */}
        <path
          data-testid="line-creation"
          d={buildMonotonePath(getPoints(creationMap))}
          fill="none" stroke="var(--accent-primary)"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />

        {/* Courbe acces */}
        <path
          data-testid="line-access"
          d={buildMonotonePath(getPoints(accessMap))}
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

        {/* Labels X */}
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
