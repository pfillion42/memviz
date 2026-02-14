import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { MemoryListResponse } from '../types';

interface UseMemoriesParams {
  limit?: number;
  offset?: number;
}

async function fetchMemories(params: UseMemoriesParams): Promise<MemoryListResponse> {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));

  const res = await fetch(`/api/memories?${searchParams}`);
  if (!res.ok) throw new Error('Erreur lors du chargement des memoires');
  return res.json();
}

export function useMemories(params: UseMemoriesParams = {}) {
  return useQuery({
    queryKey: ['memories', params],
    queryFn: () => fetchMemories(params),
    placeholderData: keepPreviousData,
  });
}
