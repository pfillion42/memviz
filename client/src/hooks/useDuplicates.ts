import { useQuery } from '@tanstack/react-query';
import type { DuplicatesResponse } from '../types';

interface UseDuplicatesParams {
  threshold?: number;
}

async function fetchDuplicates(threshold: number): Promise<DuplicatesResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('threshold', String(threshold));

  const res = await fetch(`/api/memories/duplicates?${searchParams}`);
  if (!res.ok) throw new Error('Erreur lors du chargement des doublons');
  return res.json();
}

export function useDuplicates(params: UseDuplicatesParams = {}) {
  const threshold = params.threshold ?? 0.9;

  return useQuery({
    queryKey: ['duplicates', threshold],
    queryFn: () => fetchDuplicates(threshold),
  });
}
