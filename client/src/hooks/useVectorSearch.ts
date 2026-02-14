import { useQuery } from '@tanstack/react-query';
import type { Memory } from '../types';

interface VectorSearchResult extends Memory {
  similarity: number;
}

interface VectorSearchResponse {
  data: VectorSearchResult[];
}

async function fetchVectorSearch(query: string, limit: number): Promise<VectorSearchResponse> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await fetch(`/api/memories/vector-search?${params}`);
  if (!res.ok) throw new Error('Erreur de recherche vectorielle');
  return res.json();
}

export function useVectorSearch(query: string, limit = 10) {
  return useQuery({
    queryKey: ['vector-search', query, limit],
    queryFn: () => fetchVectorSearch(query, limit),
    enabled: query.length >= 2,
  });
}
