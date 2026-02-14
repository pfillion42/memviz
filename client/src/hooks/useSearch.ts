import { useQuery } from '@tanstack/react-query';
import type { MemorySearchResponse } from '../types';

async function fetchSearch(query: string): Promise<MemorySearchResponse> {
  const res = await fetch(`/api/memories/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Erreur de recherche');
  return res.json();
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => fetchSearch(query),
    enabled: query.length >= 2,
  });
}
