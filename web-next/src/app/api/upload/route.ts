import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * BFF Upload Route — Recibe la imagen del cliente y la reenvía al backend NestJS.
 *
 * El cliente nunca habla directamente con Supabase Storage.
 * La Service Role Key solo existe en el backend.
 *
 * Flujo:
 *   Browser → POST /api/upload (Next.js BFF) → POST /api/v1/upload/image (NestJS) → Supabase Storage
 */
export async function POST(request: NextRequest) {
  // Verificar autenticación via cookie
  const accessToken = request.cookies.get('access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { message: 'Se requiere multipart/form-data' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { message: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { message: 'El archivo excede el tamaño máximo permitido (10 MB)' },
        { status: 400 }
      );
    }

    // Reenviar el archivo al backend NestJS
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const backendRes = await fetch(`${API_URL}/api/v1/upload/image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // NO incluir Content-Type — el browser/fetch lo genera automáticamente con el boundary correcto
      },
      body: backendFormData,
    });

    if (!backendRes.ok) {
      const err = await backendRes.json().catch(() => ({ message: 'Error al subir imagen' }));
      return NextResponse.json(err, { status: backendRes.status });
    }

    const result = await backendRes.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[BFF Upload] Error:', error);
    return NextResponse.json(
      { message: 'Error de conexión al subir la imagen' },
      { status: 500 }
    );
  }
}
