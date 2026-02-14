import { useQuery } from '@tanstack/react-query';
import type { Memory, GraphResponse } from '../types';

async function fetchMemory(hash: string): Promise<Memory> {
  const res = await fetch(`/api/memories/${hash}`);
  if (!res.ok) throw new Error('Memoire non trouvee');
  return res.json();
}

async function fetchGraph(hash: string): Promise<GraphResponse> {
  const res = await fetch(`/api/memories/${hash}/graph`);
  if (!res.ok) throw new Error('Erreur chargement graphe');
  return res.json();
}

export function useMemory(hash: string) {
  return useQuery({
    queryKey: ['memory', hash],
    queryFn: () => fetchMemory(hash),
    enabled: !!hash,
  });
}

export function useMemoryGraph(hash: string) {
  return useQuery({
    queryKey: ['memory-graph', hash],
    queryFn: () => fetchGraph(hash),
    enabled: !!hash,
  });
}
