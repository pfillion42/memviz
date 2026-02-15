import { useQuery } from '@tanstack/react-query';
import type { ClustersResponse } from '../types';

async function fetchClusters(threshold: number, minSize: number): Promise<ClustersResponse> {
  const params = new URLSearchParams({
    threshold: threshold.toString(),
    min_size: minSize.toString(),
  });

  const res = await fetch(`/api/memories/clusters?${params}`);
  if (!res.ok) throw new Error('Erreur lors du chargement des clusters');
  return res.json();
}

export function useClusters(threshold = 0.6, minSize = 2) {
  return useQuery({
    queryKey: ['clusters', threshold, minSize],
    queryFn: () => fetchClusters(threshold, minSize),
    staleTime: 60_000,
  });
}
