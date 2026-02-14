import { useQuery } from '@tanstack/react-query';
import type { FullGraphResponse } from '../types';

async function fetchGraph(): Promise<FullGraphResponse> {
  const res = await fetch('/api/graph');
  if (!res.ok) throw new Error('Erreur lors du chargement du graphe');
  return res.json();
}

export function useGraph() {
  return useQuery({
    queryKey: ['graph'],
    queryFn: fetchGraph,
  });
}
