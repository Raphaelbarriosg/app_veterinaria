import { test, expect } from '@playwright/test';
import { setupMockAuth, MOCK_USERS } from './fixtures/auth.fixture';

test.describe('Autenticación y Redirección por Rol', () => {
  test.beforeEach(async ({ context }) => {
    // Asegurar cookies limpias para flujos de login
    await context.clearCookies();
  });

  test('debe mostrar errores de validación si los campos están vacíos o el email es inválido', async ({ page }) => {
    await page.goto('/login');

    // Intentar enviar con campos vacíos
    await page.click('#login-submit');
    await expect(page.locator('text=Email inválido')).toBeVisible();

    // Llenar email inválido
    await page.fill('#login-email', 'correo-no-valido');
    await page.click('#login-submit');
    await expect(page.locator('text=Email inválido')).toBeVisible();
  });

  test('debe mostrar toast de error cuando las credenciales son incorrectas', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Credenciales inválidas' }),
      });
    });

    await page.goto('/login');
    await page.fill('#login-email', 'incorrecto@test.com');
    await page.fill('#login-password', 'wrongpassword');
    await page.click('#login-submit');

    await expect(page.getByText('Credenciales inválidas')).toBeVisible();
  });

  test('debe iniciar sesión como VET y redirigir a /vet', async ({ page }) => {
    await setupMockAuth(page, MOCK_USERS.vet, false);

    await page.route('**/*treatments/dashboard*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/login');
    await page.fill('#login-email', 'vet@test.com');
    await page.fill('#login-password', 'vet123');
    await page.click('#login-submit');

    await page.waitForURL('**/vet', { timeout: 10000 });
    expect(page.url()).toContain('/vet');
  });

  test('debe iniciar sesión como CLINIC_ADMIN y redirigir a /clinic-admin', async ({ page }) => {
    await setupMockAuth(page, MOCK_USERS.clinicAdmin, false);

    await page.route('**/*clinics*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            clinic: {
              id: 'clinic-1',
              name: 'VetCare Central Hospital',
              slug: 'vetcare-central',
              status: 'ACTIVE',
              maxVets: 10,
              maxPets: 500,
            },
          },
        ]),
      });
    });

    await page.goto('/login');
    await page.fill('#login-email', 'admin@test.com');
    await page.fill('#login-password', 'admin123');
    await page.click('#login-submit');

    await page.waitForURL('**/clinic-admin', { timeout: 10000 });
    expect(page.url()).toContain('/clinic-admin');
  });

  test('debe iniciar sesión como OWNER y redirigir a /owner', async ({ page }) => {
    await setupMockAuth(page, MOCK_USERS.owner, false);

    await page.route('**/*pets*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/login');
    await page.fill('#login-email', 'owner@test.com');
    await page.fill('#login-password', 'owner123');
    await page.click('#login-submit');

    await page.waitForURL('**/owner', { timeout: 10000 });
    expect(page.url()).toContain('/owner');
  });

  test('debe cerrar sesión y redirigir a /login', async ({ page }) => {
    await setupMockAuth(page, MOCK_USERS.vet, true);

    await page.route('**/*treatments/dashboard*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/vet');
    await page.waitForLoadState('domcontentloaded');

    const logoutBtn = page.locator('#logout-btn');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });
});
