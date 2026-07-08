/**
 * API Client — Wrapper de fetch para el BFF proxy
 *
 * El BFF proxy (src/app/api/v1/[...path]/route.ts) se encarga de:
 * - Leer httpOnly cookies (access_token, refresh_token)
 * - Agregar Authorization header al request al backend
 * - Rotar tokens automáticamente si el access token expira (401)
 * - Limpiar cookies si la sesión es inválida
 *
 * Este cliente solo hace fetch al BFF local (/api/v1/...)
 */

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export async function apiClient<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include', // Enviar cookies httpOnly al BFF
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`/api/v1${path}`, config);

  // Sesión expirada (el BFF ya intentó refresh y falló)
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiError('Sesión expirada', 401);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error de conexión' }));
    throw new ApiError(error.message || `Error ${response.status}`, response.status);
  }

  // Para respuestas sin contenido (204)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ============================================
// Convenience methods
// ============================================

export const api = {
  get: <T = unknown>(path: string) => apiClient<T>(path),

  post: <T = unknown>(path: string, body: unknown) =>
    apiClient<T>(path, { method: 'POST', body }),

  patch: <T = unknown>(path: string, body: unknown) =>
    apiClient<T>(path, { method: 'PATCH', body }),

  delete: <T = unknown>(path: string) =>
    apiClient<T>(path, { method: 'DELETE' }),
};