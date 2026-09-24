import { test, expect } from '@playwright/test';
import { setupMockAuth, MOCK_USERS } from './fixtures/auth.fixture';

test.describe('Portal Dueño (OWNER) — Mis Mascotas', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page, MOCK_USERS.owner, true);

    // Mock pets list for owner
    await page.route('**/*pets', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'pet-bobby-1',
            name: 'Bobby',
            species: 'DOG',
            breed: 'Golden Retriever',
            weight: 30.5,
            birthDate: '2022-05-10',
            isActive: true,
            clinicId: 'c-1',
            ownerId: 'user-owner-1',
          },
        ]),
      });
    });

    // Mock pet detail
    await page.route('**/*pets/pet-bobby-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'pet-bobby-1',
          name: 'Bobby',
          species: 'DOG',
          breed: 'Golden Retriever',
          weight: 30.5,
          birthDate: '2022-05-10',
          isActive: true,
          clinicId: 'c-1',
          ownerId: 'user-owner-1',
          treatments: [],
        }),
      });
    });
  });

  test('debe mostrar la lista de mascotas del dueño en /owner', async ({ page }) => {
    await page.goto('/owner');

    await expect(page.locator('text=Panel de monitoreo y seguimiento')).toBeVisible();
    await expect(page.locator('button:has-text("Registrar Mascota")')).toBeVisible();
    await expect(page.locator('text=Bobby').first()).toBeVisible();
    await expect(page.locator('text=Golden Retriever').first()).toBeVisible();
  });

  test('debe navegar al detalle de la mascota al hacer click', async ({ page }) => {
    await page.goto('/owner');

    await page.click('text=Bobby');
    await page.waitForURL('**/owner/pets/pet-bobby-1', { timeout: 10000 });
    expect(page.url()).toContain('/owner/pets/pet-bobby-1');
  });
});
