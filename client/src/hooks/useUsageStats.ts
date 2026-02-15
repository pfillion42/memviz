import { useQuery } from '@tanstack/react-query';
import type { UsagePeriod, UsageStatsResponse } from '../types';

async function fetchUsageStats(period: UsagePeriod): Promise<UsageStatsResponse> {
  const res = await fetch(`/api/memories/usage-stats?period=${period}`);
  if (!res.ok) throw new Error('Erreur lors du chargement des statistiques d\'utilisation');
  return res.json();
}

export function useUsageStats(period: UsagePeriod) {
  return useQuery({
    queryKey: ['usage-stats', period],
    queryFn: () => fetchUsageStats(period),
  });
}
