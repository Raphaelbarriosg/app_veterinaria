import useSWR from 'swr';
import { api } from '@/lib/api-client';
import type { DashboardItem, Treatment } from '@/lib/utils';

export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR<DashboardItem[]>(
    '/treatments/dashboard',
    (url: string) => api.get<DashboardItem[]>(url)
  );

  return {
    items: data ?? [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}

export function useTreatmentsByPet(petId: string | null) {
  const { data, error, isLoading } = useSWR<Treatment[]>(
    petId ? `/treatments/by-pet/${petId}` : null,
    (url: string) => api.get<Treatment[]>(url)
  );

  return {
    treatments: data ?? [],
    isLoading,
    isError: !!error,
  };
}

export function useTreatmentById(id: string | null) {
  const { data, error, isLoading } = useSWR<Treatment>(
    id ? `/treatments/${id}` : null,
    (url: string) => api.get<Treatment>(url)
  );

  return {
    treatment: data,
    isLoading,
    isError: !!error,
  };
}