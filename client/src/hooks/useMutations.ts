import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Memory } from '../types';

interface UpdateMemoryData {
  tags?: string[];
  memory_type?: string;
  content?: string;
}

async function updateMemory(hash: string, data: UpdateMemoryData): Promise<Memory> {
  const res = await fetch(`/api/memories/${hash}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erreur lors de la modification');
  return res.json();
}

async function deleteMemory(hash: string): Promise<{ deleted: boolean }> {
  const res = await fetch(`/api/memories/${hash}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erreur lors de la suppression');
  return res.json();
}

export function useUpdateMemory(hash: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMemoryData) => updateMemory(hash, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory', hash] });
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMemory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

async function rateMemory(hash: string, score: number): Promise<{ quality_score: number }> {
  const res = await fetch(`/api/memories/${hash}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score }),
  });
  if (!res.ok) throw new Error('Erreur lors de la notation');
  return res.json();
}

export function useRateMemory(hash: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (score: number) => rateMemory(hash, score),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory', hash] });
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
}
