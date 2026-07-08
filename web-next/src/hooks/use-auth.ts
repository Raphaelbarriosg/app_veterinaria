import useSWR from 'swr';
import { api } from '@/lib/api-client';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';
import { useEffect } from 'react';

interface AuthResponse {
  user: AuthUser;
}

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, logout } = useAuthStore();

  // Verificar sesión al montar
  const { data, error, mutate } = useSWR<AuthResponse>(
    isAuthenticated ? null : '/auth/me', // Solo si no está autenticado
    (url: string) => api.get<AuthResponse>(url),
    { shouldRetryOnError: false, revalidateOnFocus: false }
  );

  useEffect(() => {
    if (data?.user) {
      setUser(data.user);
    } else if (error) {
      useAuthStore.getState().logout();
    }
  }, [data, error, setUser]);

  return {
    user,
    isAuthenticated,
    isLoading,
    logout: async () => {
      try {
        await api.post('/auth/logout', {});
      } finally {
        logout();
        mutate(undefined, false);
      }
    },
    refresh: mutate,
  };
}