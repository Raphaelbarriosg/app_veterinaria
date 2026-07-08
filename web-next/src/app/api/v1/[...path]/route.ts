import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * BFF Proxy — Lee httpOnly cookies y las convierte en Authorization header
 * para el backend NestJS. Los tokens NUNCA son accesibles desde JavaScript.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, (await params).path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, (await params).path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, (await params).path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, (await params).path);
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[]
) {
  const path = pathSegments.join('/');
  const accessToken = request.cookies.get('access_token')?.value;

  // Construir headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Construir URL con query params
  const url = new URL(request.url);
  const targetUrl = `${API_URL}/api/v1/${path}${url.search}`;

  // Construir opciones del fetch
  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
  };

  // Para métodos con body
  if (request.method !== 'GET' && request.method !== 'DELETE') {
    try {
      const body = await request.json();
      fetchOptions.body = JSON.stringify(body);
    } catch {
      // No body
    }
  }

  try {
    let response = await fetch(targetUrl, fetchOptions);

    // Si la petición falla con 401 (token expirado o ausente), intentar refresh
    if (response.status === 401) {
      const refreshToken = request.cookies.get('refresh_token')?.value;

      if (refreshToken) {
        const refreshRes = await fetch(`${API_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();

          // Reintentar request original con nuevo token
          headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
          fetchOptions.headers = headers;
          response = await fetch(targetUrl, fetchOptions);

          // Actualizar cookies en la respuesta
          const finalResponse = NextResponse.json(await response.json(), {
            status: response.status,
          });

          finalResponse.cookies.set('access_token', refreshData.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 15, // 15 minutos
          });

          finalResponse.cookies.set('refresh_token', refreshData.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 días
          });

          return finalResponse;
        }
      }

      // Refresh falló o no había refresh_token — limpiar cookies
      const failResponse = NextResponse.json(
        { message: 'Sesión expirada' },
        { status: 401 }
      );
      failResponse.cookies.set('access_token', '', { maxAge: 0, path: '/' });
      failResponse.cookies.set('refresh_token', '', { maxAge: 0, path: '/' });
      return failResponse;
    }

    // Respuesta normal
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return NextResponse.json(await response.json(), { status: response.status });
    }

    return new NextResponse(response.body, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: 'Error de conexión con el servidor' },
      { status: 500 }
    );
  }
}