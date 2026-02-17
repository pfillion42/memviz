import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMemory, useMemoryGraph } from '../hooks/useMemory';
import { useUpdateMemory, useDeleteMemory } from '../hooks/useMutations';
import { TagBadge } from '../components/TagBadge';
import { QualityVoter } from '../components/QualityVoter';
import { useLanguage } from '../i18n/LanguageContext';

const btnBase: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: '13px',
  fontWeight: 500,
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
};

const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: '13px',
  backgroundColor: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-sm)',
  outline: 'none',
};

export function MemoryDetail() {
  const { hash } = useParams<{ hash: string }>();
  const navigate = useNavigate();
  const memoryQuery = useMemory(hash || '');
  const graphQuery = useMemoryGraph(hash || '');
  const updateMutation = useUpdateMemory(hash || '');
  const deleteMutation = useDeleteMemory();
  const { t } = useLanguage();

  // Auto-increment acces au montage (fire-and-forget)
  useEffect(() => {
    if (hash) {
      fetch(`/api/memories/${hash}/access`, { method: 'POST' }).catch(() => {
        // silencieux : ne bloque pas l'affichage
      });
    }
  }, [hash]);

  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editType, setEditType] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (memoryQuery.isLoading) {
    return <p style={{ color: 'var(--text-muted)' }}>{t('loading')}</p>;
  }

  if (memoryQuery.isError || !memoryQuery.data) {
    return <p style={{ color: 'var(--error)' }}>{t('md_not_found')}</p>;
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
      <Link to="/memories" style={{ color: 'var(--accent-primary-hover)', textDecoration: 'none', fontSize: '13px' }}>
        {t('md_back')}
      </Link>

      <div style={{
        marginTop: '16px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        padding: '24px',
      }}>
        {/* Header: type + quality + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          {editing ? (
            <input
              value={editType}
              onChange={e => setEditType(e.target.value)}
              placeholder="Type"
              aria-label={t('md_aria_memory_type')}
              style={{ ...inputStyle, width: '120px' }}
            />
          ) : (
            m.memory_type && (
              <span style={{
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: 'var(--info-dim)',
                color: 'var(--info)',
                borderRadius: 'var(--radius-sm)',
              }}>
                {m.memory_type}
              </span>
            )
          )}
          <QualityVoter hash={hash!} score={qualityScore} />

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            {editing ? (
              <>
                <button onClick={saveEdit} disabled={updateMutation.isPending} aria-label={t('save')}
                  style={{ ...btnBase, background: 'var(--accent-gradient)', color: 'white', border: 'none' }}>
                  {updateMutation.isPending ? t('saving') : t('save')}
                </button>
                <button onClick={cancelEdit} aria-label={t('cancel')}
                  style={{ ...btnBase, backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
                  {t('cancel')}
                </button>
              </>
            ) : (
              <>
                <button onClick={startEdit} aria-label={t('edit')}
                  style={{ ...btnBase, backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
                  {t('edit')}
                </button>
                <button onClick={handleDelete} disabled={deleteMutation.isPending} aria-label={confirmDelete ? t('md_confirm_delete') : t('delete')}
                  style={{
                    ...btnBase,
                    backgroundColor: confirmDelete ? 'var(--error)' : 'transparent',
                    color: confirmDelete ? 'white' : 'var(--error)',
                    border: confirmDelete ? 'none' : '1px solid var(--error)',
                  }}>
                  {confirmDelete ? t('md_confirm_delete') : t('delete')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {editing ? (
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            aria-label={t('md_aria_memory_content')}
            rows={6}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              resize: 'vertical',
              fontFamily: 'inherit',
              lineHeight: 1.6,
              outline: 'none',
            }}
          />
        ) : (
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.7,
            color: 'var(--text-primary)',
          }}>
            {m.content}
          </div>
        )}

        {/* Tags */}
        <div style={{ marginTop: '14px' }}>
          {editing ? (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('md_tags_label')}
              </label>
              <input
                value={editTags}
                onChange={e => setEditTags(e.target.value)}
                aria-label="Tags"
                style={{ ...inputStyle, width: '100%', marginTop: '6px' }}
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
          <p style={{ color: 'var(--error)', marginTop: '8px', fontSize: '13px' }}>{t('md_error_save')}</p>
        )}

        {/* Metadata grid */}
        <div style={{
          marginTop: '20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          fontSize: '13px',
          color: 'var(--text-muted)',
          padding: '16px',
          backgroundColor: 'var(--bg-base)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('md_created')}</span>
            <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{new Date(m.created_at_iso).toLocaleString('fr-CA')}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('md_modified')}</span>
            <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{new Date(m.updated_at_iso).toLocaleString('fr-CA')}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('md_hash')}</span>
            <div style={{ color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'monospace', fontSize: '12px' }}>{m.content_hash}</div>
          </div>
          {meta?.access_count != null && (
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('md_accesses')}</span>
              <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{String(meta.access_count)}</div>
            </div>
          )}
        </div>

        {/* Metadata JSON */}
        {meta && (
          <details style={{ marginTop: '16px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)' }}>Metadata JSON</summary>
            <pre style={{
              marginTop: '8px',
              padding: '16px',
              backgroundColor: 'var(--bg-base)',
              color: 'var(--accent-primary-hover)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              overflow: 'auto',
              fontSize: '12px',
              lineHeight: 1.5,
            }}>
              {JSON.stringify(meta, null, 2)}
            </pre>
          </details>
        )}

        {/* Graph associations */}
        {graphQuery.data && graphQuery.data.data.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>{t('md_associations')}</h3>
            <div style={{
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-base)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('md_linked_hash')}</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('md_similarity')}</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('type')}</th>
                  </tr>
                </thead>
                <tbody>
                  {graphQuery.data.data.map((edge) => {
                    const linkedHash = edge.source_hash === hash ? edge.target_hash : edge.source_hash;
                    return (
                      <tr key={`${edge.source_hash}-${edge.target_hash}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <Link to={`/memories/${linkedHash}`} style={{ color: 'var(--accent-primary-hover)', textDecoration: 'none', fontFamily: 'monospace', fontSize: '12px' }}>
                            {linkedHash}
                          </Link>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--success)', fontWeight: 600 }}>
                          {(edge.similarity * 100).toFixed(0)}%
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{edge.relationship_type}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
