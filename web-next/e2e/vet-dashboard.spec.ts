import { test, expect } from '@playwright/test';
import { setupMockAuth, MOCK_USERS } from './fixtures/auth.fixture';

test.describe('Dashboard Veterinario — Semáforo y Prioridades', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page, MOCK_USERS.vet, true);

    // Mock treatments dashboard with RED and GREEN
    await page.route('**/*treatments/dashboard*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            treatmentId: 'tx-red-1',
            pet: {
              id: 'pet-1',
              name: 'Thor',
              species: 'DOG',
              owner: { id: 'o-1', name: 'Juan Pérez', phone: '+56 9 1111 2222' },
            },
            diagnosis: 'Cirugía de fémur',
            procedureType: 'ORTHOPEDIC_FRACTURE',
            startDate: new Date().toISOString(),
            priority: 'RED',
            stats: {
              expectedDoses: 3,
              actualDoses: 1,
              hasAlarmSigns: true,
              hasFever: true,
              logsCount24h: 1,
              medLogsCount24h: 1,
            },
            recentLogs: [
              {
                id: 'log-1',
                treatmentId: 'tx-red-1',
                registeredAt: new Date().toISOString(),
                appetiteLevel: 1,
                energyLevel: 1,
                alarmSigns: 'Fiebre y herida enrojecida',
              },
            ],
          },
          {
            treatmentId: 'tx-green-2',
            pet: {
              id: 'pet-2',
              name: 'Misi',
              species: 'CAT',
              owner: { id: 'o-2', name: 'Laura Gómez', phone: '+56 9 3333 4444' },
            },
            diagnosis: 'Esterilización preventiva',
            procedureType: 'OVARIOHYSTERECTOMY',
            startDate: new Date().toISOString(),
            priority: 'GREEN',
            stats: {
              expectedDoses: 2,
              actualDoses: 2,
              hasAlarmSigns: false,
              hasFever: false,
              logsCount24h: 2,
              medLogsCount24h: 2,
            },
            recentLogs: [
              {
                id: 'log-2',
                treatmentId: 'tx-green-2',
                registeredAt: new Date().toISOString(),
                appetiteLevel: 5,
                energyLevel: 4,
              },
            ],
          },
        ]),
      });
    });

    // Mock pets list
    await page.route('**/*pets*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'pet-1', name: 'Thor', species: 'DOG', ownerId: 'o-1', clinicId: 'c-1' },
          { id: 'pet-2', name: 'Misi', species: 'CAT', ownerId: 'o-2', clinicId: 'c-1' },
        ]),
      });
    });
  });

  test('debe mostrar las métricas del semáforo clínico (Rojo, Amarillo, Verde)', async ({ page }) => {
    await page.goto('/vet');

    await expect(page.locator('text=Semáforo de prioridades')).toBeVisible();
    await expect(page.locator('text=Thor').first()).toBeVisible();
    await expect(page.locator('text=Misi').first()).toBeVisible();
    await expect(page.locator('text=Cirugía de fémur').first()).toBeVisible();
  });

  test('debe permitir buscar pacientes en el buscador', async ({ page }) => {
    await page.goto('/vet');

    const searchInput = page.locator('input[placeholder*="paciente"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Thor');
    await expect(page.locator('text=Thor').first()).toBeVisible();
  });
});
