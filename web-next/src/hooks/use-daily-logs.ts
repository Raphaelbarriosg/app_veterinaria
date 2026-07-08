import useSWR from 'swr';
import { api } from '@/lib/api-client';
import type { DailyLog } from '@/lib/utils';

interface PaginatedResponse {
  data: DailyLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function useDailyLogs(treatmentId: string | null, page = 1, limit = 20) {
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse>(
    treatmentId ? `/daily-logs/treatment/${treatmentId}?page=${page}&limit=${limit}` : null,
    (url: string) => api.get<PaginatedResponse>(url)
  );

  return {
    logs: data?.data ?? [],
    meta: data?.meta ?? { total: 0, page: 1, limit, totalPages: 0 },
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}