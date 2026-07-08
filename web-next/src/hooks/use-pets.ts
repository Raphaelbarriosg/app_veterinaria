import useSWR from 'swr';
import { api } from '@/lib/api-client';
import type { Pet } from '@/lib/utils';

export function usePets() {
  const { data, error, isLoading, mutate } = useSWR<Pet[]>(
    '/pets',
    (url: string) => api.get<Pet[]>(url)
  );

  return {
    pets: data ?? [],
    isLoading,
    isError: !!error,
    refreshPets: mutate,
  };
}

export function usePetById(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Pet>(
    id ? `/pets/${id}` : null,
    (url: string) => api.get<Pet>(url)
  );

  return {
    pet: data,
    isLoading,
    isError: !!error,
    refreshPet: mutate,
  };
}

export function usePetSearch(query: string) {
  const { data, error, isLoading } = useSWR<Pet[]>(
    query ? `/pets/search?q=${encodeURIComponent(query)}` : null,
    (url: string) => api.get<Pet[]>(url)
  );

  return {
    results: data ?? [],
    isLoading,
    isError: !!error,
  };
}