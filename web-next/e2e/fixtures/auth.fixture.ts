import { Page } from '@playwright/test';

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'VET' | 'OWNER' | 'CLINIC_ADMIN' | 'SUPER_ADMIN';
  phone?: string;
}

export const MOCK_USERS: Record<string, MockUser> = {
  vet: {
    id: 'user-vet-1',
    email: 'vet@test.com',
    name: 'Dr. María González',
    role: 'VET',
    phone: '+34 600 123 456',
  },
  owner: {
    id: 'user-owner-1',
    email: 'owner@test.com',
    name: 'Carlos Rodríguez',
    role: 'OWNER',
    phone: '+34 611 987 654',
  },
  clinicAdmin: {
    id: 'user-admin-1',
    email: 'admin@test.com',
    name: 'Dra. Ana Martínez (Admin)',
    role: 'CLINIC_ADMIN',
    phone: '+34 622 555 789',
  },
};

export async function setupMockAuth(page: Page, user: MockUser, setCookiesDirectly: boolean = true) {
  if (setCookiesDirectly) {
    // Agregar cookies al contexto para que proxy.ts (Next.js middleware) permita acceso a rutas protegidas
    await page.context().addCookies([
      {
        name: 'access_token',
        value: 'mock-jwt-access-token',
        url: 'http://localhost:3001',
        httpOnly: true,
        sameSite: 'Lax',
      },
      {
        name: 'refresh_token',
        value: 'mock-jwt-refresh-token',
        url: 'http://localhost:3001',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
  }

  // Interceptar login
  await page.route('**/api/auth/login', async (route) => {
    // Cuando el formulario de login hace fetch, setear las cookies en el browser
    await page.context().addCookies([
      {
        name: 'access_token',
        value: 'mock-jwt-access-token',
        url: 'http://localhost:3001',
        httpOnly: true,
        sameSite: 'Lax',
      },
      {
        name: 'refresh_token',
        value: 'mock-jwt-refresh-token',
        url: 'http://localhost:3001',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user, accessToken: 'mock-jwt-access-token' }),
    });
  });

  // Interceptar verificación de sesión
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user }),
    });
  });

  await page.route('**/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user }),
    });
  });

  // Interceptar logout
  await page.route('**/api/auth/logout', async (route) => {
    await page.context().clearCookies();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}
