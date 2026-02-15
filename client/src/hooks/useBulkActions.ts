import { useMutation, useQueryClient } from '@tanstack/react-query';

interface BulkDeletePayload {
  hashes: string[];
}

interface BulkTagPayload {
  hashes: string[];
  add_tags?: string[];
  remove_tags?: string[];
}

interface BulkTypePayload {
  hashes: string[];
  memory_type: string;
}

async function bulkDelete(payload: BulkDeletePayload): Promise<{ deleted: number }> {
  const res = await fetch('/api/memories/bulk-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Erreur lors de la suppression en masse');
  return res.json();
}

async function bulkTag(payload: BulkTagPayload): Promise<{ updated: number }> {
  const res = await fetch('/api/memories/bulk-tag', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Erreur lors de la modification des tags en masse');
  return res.json();
}

async function bulkType(payload: BulkTypePayload): Promise<{ updated: number }> {
  const res = await fetch('/api/memories/bulk-type', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Erreur lors de la modification du type en masse');
  return res.json();
}

export function useBulkDelete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useBulkTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useBulkType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
