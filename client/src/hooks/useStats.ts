import { useQuery } from '@tanstack/react-query';
import type { MemoryStats, TagsResponse } from '../types';

async function fetchStats(): Promise<MemoryStats> {
  const res = await fetch('/api/memories/stats');
  if (!res.ok) throw new Error('Erreur chargement statistiques');
  return res.json();
}

async function fetchTags(): Promise<TagsResponse> {
  const res = await fetch('/api/tags');
  if (!res.ok) throw new Error('Erreur chargement tags');
  return res.json();
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });
}
