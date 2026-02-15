import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { MemoryListResponse, MemoryFilters } from '../types';

interface UseMemoriesParams extends MemoryFilters {
  limit?: number;
  offset?: number;
}

async function fetchMemories(params: UseMemoriesParams): Promise<MemoryListResponse> {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));
  if (params.type) searchParams.set('type', params.type);
  if (params.tags && params.tags.length > 0) searchParams.set('tags', params.tags.join(','));
  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);
  if (params.quality_min !== undefined) searchParams.set('quality_min', String(params.quality_min));
  if (params.quality_max !== undefined) searchParams.set('quality_max', String(params.quality_max));

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
