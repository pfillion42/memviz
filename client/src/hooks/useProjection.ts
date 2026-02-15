import { useQuery } from '@tanstack/react-query';
import type { ProjectionResponse } from '../types';

async function fetchProjection(nNeighbors: number, minDist: number): Promise<ProjectionResponse> {
  const params = new URLSearchParams({
    n_neighbors: nNeighbors.toString(),
    min_dist: minDist.toString(),
  });

  const res = await fetch(`/api/memories/projection?${params}`);
  if (!res.ok) throw new Error('Erreur lors du chargement de la projection');
  return res.json();
}

export function useProjection(nNeighbors = 15, minDist = 0.1) {
  return useQuery({
    queryKey: ['projection', nNeighbors, minDist],
    queryFn: () => fetchProjection(nNeighbors, minDist),
    staleTime: 60_000,
  });
}
