import { useGraph } from '../hooks/useGraph';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';

const TYPE_COLORS: Record<string, string> = {
  note: '#3b82f6',
  decision: '#f59e0b',
  observation: '#10b981',
  fact: '#8b5cf6',
  reminder: '#ef4444',
  document: '#6366f1',
};

const DEFAULT_COLOR = '#6b7280';

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
    return <p>Chargement...</p>;
  }

  if (isError) {
    return <p>Erreur lors du chargement du graphe.</p>;
  }

  const nodes = data?.nodes ?? [];
  const links = data?.links ?? [];

  if (nodes.length === 0) {
    return <p>Aucune association trouvee dans le graphe.</p>;
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>Graphe d'associations</h2>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>
          {nodes.length} noeuds, {links.length} liens
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
            {type}
          </span>
        ))}
      </div>

      <div data-testid="graph-container" style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        <ForceGraph2D
          graphData={graphData}
          nodeLabel="label"
          nodeColor="color"
          nodeRelSize={6}
          linkWidth={(link: any) => (link.similarity || 0.5) * 3}
          linkColor={() => '#d1d5db'}
          linkDirectionalParticles={1}
          linkDirectionalParticleSpeed={0.005}
          onNodeClick={handleNodeClick}
          width={1050}
          height={500}
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D) => {
            const x = node.x || 0;
            const y = node.y || 0;
            const r = 5;

            // Cercle
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.fillStyle = node.color || DEFAULT_COLOR;
            ctx.fill();

            // Label
            const label = (node.label || '').substring(0, 30);
            ctx.font = '3px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#374151';
            ctx.fillText(label, x, y + r + 4);
          }}
        />
      </div>
    </div>
  );
}
