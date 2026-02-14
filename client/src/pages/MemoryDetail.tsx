import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMemory, useMemoryGraph } from '../hooks/useMemory';
import { useUpdateMemory, useDeleteMemory } from '../hooks/useMutations';
import { TagBadge } from '../components/TagBadge';
import { QualityIndicator } from '../components/QualityIndicator';

export function MemoryDetail() {
  const { hash } = useParams<{ hash: string }>();
  const navigate = useNavigate();
  const memoryQuery = useMemory(hash || '');
  const graphQuery = useMemoryGraph(hash || '');
  const updateMutation = useUpdateMemory(hash || '');
  const deleteMutation = useDeleteMemory();

  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editType, setEditType] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (memoryQuery.isLoading) {
    return <p>Chargement...</p>;
  }

  if (memoryQuery.isError || !memoryQuery.data) {
    return <p>Memoire non trouvee ou erreur de chargement.</p>;
  }

  const m = memoryQuery.data;
  const meta = m.metadata as Record<string, unknown> | null;
  const qualityScore = meta?.quality_score as number | undefined;

  function startEdit() {
    setEditContent(m.content);
    setEditTags(m.tags.join(', '));
    setEditType(m.memory_type || '');
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setConfirmDelete(false);
  }

  function saveEdit() {
    const updates: Record<string, unknown> = {};
    if (editContent !== m.content) updates.content = editContent;
    if (editTags !== m.tags.join(', ')) {
      updates.tags = editTags.split(',').map(t => t.trim()).filter(Boolean);
    }
    if (editType !== (m.memory_type || '')) updates.memory_type = editType;

    if (Object.keys(updates).length > 0) {
      updateMutation.mutate(updates, {
        onSuccess: () => setEditing(false),
      });
    } else {
      setEditing(false);
    }
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteMutation.mutate(hash!, {
      onSuccess: () => navigate('/'),
    });
  }

  return (
    <div>
      <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '14px' }}>
        &larr; Retour a la liste
      </Link>

      <div style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          {editing ? (
            <input
              value={editType}
              onChange={e => setEditType(e.target.value)}
              placeholder="Type"
              aria-label="Type de memoire"
              style={{ padding: '4px 8px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '4px', width: '120px' }}
            />
          ) : (
            m.memory_type && (
              <span style={{
                padding: '4px 10px',
                fontSize: '13px',
                backgroundColor: '#dbeafe',
                borderRadius: '4px',
                fontWeight: 600,
              }}>
                {m.memory_type}
              </span>
            )
          )}
          <QualityIndicator score={qualityScore} />

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            {editing ? (
              <>
                <button onClick={saveEdit} disabled={updateMutation.isPending} aria-label="Sauvegarder"
                  style={{ padding: '4px 12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {updateMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
                <button onClick={cancelEdit} aria-label="Annuler"
                  style={{ padding: '4px 12px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>
                  Annuler
                </button>
              </>
            ) : (
              <>
                <button onClick={startEdit} aria-label="Modifier"
                  style={{ padding: '4px 12px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>
                  Modifier
                </button>
                <button onClick={handleDelete} disabled={deleteMutation.isPending} aria-label={confirmDelete ? 'Confirmer suppression' : 'Supprimer'}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: confirmDelete ? '#dc2626' : 'transparent',
                    color: confirmDelete ? 'white' : '#dc2626',
                    border: confirmDelete ? 'none' : '1px solid #dc2626',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}>
                  {confirmDelete ? 'Confirmer suppression' : 'Supprimer'}
                </button>
              </>
            )}
          </div>
        </div>

        {editing ? (
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            aria-label="Contenu de la memoire"
            rows={6}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              resize: 'vertical',
              fontFamily: 'inherit',
              lineHeight: 1.6,
            }}
          />
        ) : (
          <div style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6,
          }}>
            {m.content}
          </div>
        )}

        <div style={{ marginTop: '12px' }}>
          {editing ? (
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Tags (separes par virgule) :</label>
              <input
                value={editTags}
                onChange={e => setEditTags(e.target.value)}
                aria-label="Tags"
                style={{ width: '100%', padding: '6px 8px', marginTop: '4px', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
            </div>
          ) : (
            <div role="list">
              {m.tags.map(tag => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}
        </div>

        {updateMutation.isError && (
          <p style={{ color: '#dc2626', marginTop: '8px' }}>Erreur lors de la sauvegarde.</p>
        )}

        <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', color: '#6b7280' }}>
          <div>
            <strong>Cree le :</strong> {new Date(m.created_at_iso).toLocaleString('fr-CA')}
          </div>
          <div>
            <strong>Modifie le :</strong> {new Date(m.updated_at_iso).toLocaleString('fr-CA')}
          </div>
          <div>
            <strong>Hash :</strong> <code style={{ fontSize: '12px' }}>{m.content_hash}</code>
          </div>
          {meta?.access_count != null && (
            <div>
              <strong>Acces :</strong> {String(meta.access_count)}
            </div>
          )}
        </div>

        {meta && (
          <details style={{ marginTop: '16px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>Metadata JSON</summary>
            <pre style={{
              marginTop: '8px',
              padding: '12px',
              backgroundColor: '#1f2937',
              color: '#e5e7eb',
              borderRadius: '6px',
              overflow: 'auto',
              fontSize: '12px',
            }}>
              {JSON.stringify(meta, null, 2)}
            </pre>
          </details>
        )}

        {graphQuery.data && graphQuery.data.data.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Associations</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '6px' }}>Hash lie</th>
                  <th style={{ padding: '6px' }}>Similarite</th>
                  <th style={{ padding: '6px' }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {graphQuery.data.data.map((edge) => {
                  const linkedHash = edge.source_hash === hash ? edge.target_hash : edge.source_hash;
                  return (
                    <tr key={`${edge.source_hash}-${edge.target_hash}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '6px' }}>
                        <Link to={`/memories/${linkedHash}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                          {linkedHash}
                        </Link>
                      </td>
                      <td style={{ padding: '6px' }}>{(edge.similarity * 100).toFixed(0)}%</td>
                      <td style={{ padding: '6px' }}>{edge.relationship_type}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
