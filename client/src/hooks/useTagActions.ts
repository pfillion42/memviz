import { useMutation, useQueryClient } from '@tanstack/react-query';

async function renameTag(tag: string, newName: string): Promise<void> {
  const res = await fetch(`/api/tags/${encodeURIComponent(tag)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_name: newName }),
  });
  if (!res.ok) throw new Error('Erreur lors du renommage du tag');
}

async function deleteTag(tag: string): Promise<void> {
  const res = await fetch(`/api/tags/${encodeURIComponent(tag)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Erreur lors de la suppression du tag');
}

async function mergeTags(sources: string[], target: string): Promise<void> {
  const res = await fetch('/api/tags/merge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sources, target }),
  });
  if (!res.ok) throw new Error('Erreur lors de la fusion des tags');
}

export function useRenameTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tag, newName }: { tag: string; newName: string }) => renameTag(tag, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tag: string) => deleteTag(tag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}

export function useMergeTags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sources, target }: { sources: string[]; target: string }) => mergeTags(sources, target),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}
