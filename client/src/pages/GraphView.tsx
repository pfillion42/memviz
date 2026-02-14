import { useGraph } from '../hooks/useGraph';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';


const TYPE_COLORS: Record<string, string> = {
  note: '#3b82f6',
  decision: '#f59e0b',
  observation: '#22c55e',
  fact: '#a78bfa',
  reminder: '#f43f5e',
  document: '#6366f1',
};

const DEFAULT_COLOR = '#5c5c66';

export function GraphView() {
  const { data, isLoading, isError } = useGraph();
  const navigate = useNavigate();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeClick = useCallback((node: any) => {
    if (node.id && typeof node.id === 'string') {
      navigate(`/memories/${node.id}`);
    }
  }, [navigate]);

  if (isLoading) {
    return <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>;
  }

  if (isError) {
    return <p style={{ color: 'var(--error)' }}>Erreur lors du chargement du graphe.</p>;
  }

  const nodes = data?.nodes ?? [];
  const links = data?.links ?? [];

  if (nodes.length === 0) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
      Aucune association trouvee dans le graphe.
    </p>;
  }

  const graphData = {
    nodes: nodes.map(n => ({
      id: n.id,
      label: n.content,
      memory_type: n.memory_type,
      tags: n.tags,
      color: TYPE_COLORS[n.memory_type || ''] || DEFAULT_COLOR,
    })),
    links: links.map(l => ({
      source: l.source,
      target: l.target,
      similarity: l.similarity,
      relationship_type: l.relationship_type,
    })),
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Graphe d'associations
        </h2>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {nodes.length} noeuds, {links.length} liens
        </span>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: color,
              display: 'inline-block',
              boxShadow: `0 0 6px ${color}60`,
            }} />
            {type}
          </span>
        ))}
      </div>

      <div data-testid="graph-container" style={{
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-surface)',
      }}>
        <ForceGraph2D
          graphData={graphData}
          nodeLabel="label"
          nodeColor="color"
          nodeRelSize={6}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          linkWidth={(link: any) => (link.similarity || 0.5) * 3}
          linkColor={() => 'rgba(99, 102, 241, 0.2)'}
          linkDirectionalParticles={1}
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleColor={() => '#6366f1'}
          onNodeClick={handleNodeClick}
          width={1150}
          height={500}
          backgroundColor="#111113"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D) => {
            const x = node.x || 0;
            const y = node.y || 0;
            const r = 5;

            // Glow
            ctx.beginPath();
            ctx.arc(x, y, r + 3, 0, 2 * Math.PI);
            ctx.fillStyle = (node.color || DEFAULT_COLOR) + '20';
            ctx.fill();

            // Cercle
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.fillStyle = node.color || DEFAULT_COLOR;
            ctx.fill();

            // Label
            const label = (node.label || '').substring(0, 30);
            ctx.font = '3px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#8b8b97';
            ctx.fillText(label, x, y + r + 5);
          }}
        />
      </div>
    </div>
  );
}
