import { useQuery } from '@tanstack/react-query';
import type { TimelineResponse } from '../types';

async function fetchTimeline(): Promise<TimelineResponse> {
  const res = await fetch('/api/memories/timeline');
  if (!res.ok) throw new Error('Erreur lors du chargement de la timeline');
  return res.json();
}

export function useTimeline() {
  return useQuery({
    queryKey: ['timeline'],
    queryFn: fetchTimeline,
  });
}
