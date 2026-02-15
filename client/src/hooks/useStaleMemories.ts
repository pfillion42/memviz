import { useQuery } from '@tanstack/react-query';
import type { Memory } from '../types';

export interface StaleResponse {
  data: Memory[];
  total: number;
  criteria: {
    days: number;
    quality_max: number;
  };
}

async function fetchStaleMemories(days: number, qualityMax: number): Promise<StaleResponse> {
  const params = new URLSearchParams({
    days: days.toString(),
    quality_max: qualityMax.toString(),
  });

  const res = await fetch(`/api/memories/stale?${params}`);
  if (!res.ok) throw new Error('Erreur lors du chargement des memoires obsoletes');
  return res.json();
}

export function useStaleMemories(days: number, qualityMax: number) {
  return useQuery({
    queryKey: ['stale-memories', days, qualityMax],
    queryFn: () => fetchStaleMemories(days, qualityMax),
  });
}
