import { test, expect } from '@playwright/test';
import { setupMockAuth, MOCK_USERS } from './fixtures/auth.fixture';

test.describe('Portal CLINIC_ADMIN — Estadísticas y Equipo', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page, MOCK_USERS.clinicAdmin, true);

    // Mock clínicas
    await page.route('**/*clinics', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            clinic: {
              id: 'clinic-1',
              name: 'VetCare Central Hospital',
              slug: 'vetcare-central',
              email: 'contacto@vetcarecentral.cl',
              phone: '+56 2 2345 6789',
              address: 'Av. Providencia 1234',
              status: 'ACTIVE',
              maxVets: 10,
              maxPets: 500,
            },
          },
        ]),
      });
    });

    // Mock estadísticas en tiempo real
    await page.route('**/*clinics/clinic-1/stats*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          clinic: {
            id: 'clinic-1',
            name: 'VetCare Central Hospital',
            slug: 'vetcare-central',
            email: 'contacto@vetcarecentral.cl',
            phone: '+56 2 2345 6789',
            address: 'Av. Providencia 1234',
            status: 'ACTIVE',
            timezone: 'America/Santiago',
            currency: 'CLP',
          },
          totalPets: 42,
          activeTreatments: 12,
          completedTreatments: 85,
          criticalAlerts: 3,
          vetsCount: 5,
          adminsCount: 2,
          ownersCount: 35,
          totalMembers: 42,
          pendingInvitations: 1,
          speciesDistribution: [
            { species: 'DOG', count: 28 },
            { species: 'CAT', count: 14 },
          ],
          capacity: {
            currentVets: 5,
            maxVets: 10,
            currentPets: 42,
            maxPets: 500,
            pctVets: 50,
            pctPets: 8,
          },
          subscription: {
            planType: 'PROFESSIONAL',
            status: 'ACTIVE',
            daysRemaining: 180,
          },
          recentActivity: [
            {
              id: 'log-1',
              treatmentId: 'tx-1',
              petName: 'Max',
              petSpecies: 'DOG',
              diagnosis: 'Ovariohisterectomía',
              registeredByName: 'Dr. María González',
              registeredByRole: 'VET',
              registeredAt: new Date().toISOString(),
              logType: 'CLINICAL',
              alarmSigns: undefined,
            },
          ],
        }),
      });
    });

    // Mock miembros
    await page.route('**/*clinics/clinic-1/members', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'mem-1',
            clinicId: 'clinic-1',
            userId: 'user-admin-1',
            role: 'CLINIC_ADMIN',
            joinedAt: new Date('2026-01-01').toISOString(),
            isActive: true,
            user: {
              id: 'user-admin-1',
              name: 'Dra. Ana Martínez (Admin)',
              email: 'admin@test.com',
            },
          },
          {
            id: 'mem-2',
            clinicId: 'clinic-1',
            userId: 'user-vet-1',
            role: 'VET',
            joinedAt: new Date('2026-02-01').toISOString(),
            isActive: true,
            user: {
              id: 'user-vet-1',
              name: 'Dr. María González',
              email: 'vet@test.com',
            },
          },
        ]),
      });
    });

    // Mock invitaciones
    await page.route('**/*clinics/clinic-1/invitations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'inv-1',
            clinicId: 'clinic-1',
            email: 'nuevo-vet@test.com',
            role: 'VET',
            token: 'token-abc-123',
            invitedBy: 'user-admin-1',
            expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
          },
        ]),
      });
    });
  });

  test('debe mostrar las tarjetas KPI de estadísticas en tiempo real', async ({ page }) => {
    await page.goto('/clinic-admin');

    await expect(page.locator('text=VetCare Central Hospital').first()).toBeVisible();
    await expect(page.locator('text=Pacientes Registrados')).toBeVisible();
    await expect(page.locator('text=Tratamientos Activos')).toBeVisible();
    await expect(page.locator('text=Veterinarios Activos')).toBeVisible();
    await expect(page.locator('text=Casos Críticos / Alertas')).toBeVisible();

    // Valores mockeados
    await expect(page.locator('text=42').first()).toBeVisible();
    await expect(page.locator('text=12').first()).toBeVisible();
  });

  test('debe navegar a la pestaña de Equipo y listar los miembros e invitaciones pendientes', async ({ page }) => {
    await page.goto('/clinic-admin');

    // Click en pestaña Equipo
    await page.click('#admin-tab-team');

    await expect(page.locator('text=Personal de la Clínica')).toBeVisible();
    await expect(page.locator('.member-name').filter({ hasText: 'Dra. Ana Martínez (Admin)' })).toBeVisible();
    await expect(page.locator('.member-name').filter({ hasText: 'Dr. María González' })).toBeVisible();

    // Sección de invitaciones pendientes
    await expect(page.locator('text=Invitaciones Pendientes (1)')).toBeVisible();
    await expect(page.locator('text=nuevo-vet@test.com')).toBeVisible();
    await expect(page.locator('button:has-text("Copiar Enlace")')).toBeVisible();
    await expect(page.locator('button:has-text("Revocar")')).toBeVisible();
  });

  test('debe abrir el modal de invitar miembro y validar el formulario', async ({ page }) => {
    // Interceptar envío de invitación
    await page.route('**/*clinics/clinic-1/members/invite', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'inv-new', email: 'vet-invitado@test.com' }),
      });
    });

    await page.goto('/clinic-admin');

    // Click en Invitar Miembro
    await page.click('#admin-invite-btn');

    await expect(page.locator('text=Invitar a la Clínica')).toBeVisible();

    // Llenar formulario
    await page.fill('#modal-invite-email', 'vet-invitado@test.com');
    await page.selectOption('#modal-invite-role', 'VET');

    await page.click('button:has-text("Enviar Invitación")');

    await expect(page.getByText('Invitación enviada con éxito')).toBeVisible();
  });

  test('debe permitir cambiar de pestaña a Configuración y mostrar los campos', async ({ page }) => {
    await page.goto('/clinic-admin');

    await page.click('button:has-text("Configuración")');

    await expect(page.locator('text=Datos Generales de la Clínica')).toBeVisible();
    await expect(page.locator('#clinic-name')).toHaveValue('VetCare Central Hospital');
    await expect(page.locator('#clinic-phone')).toHaveValue('+56 2 2345 6789');
    await expect(page.locator('#clinic-email')).toHaveValue('contacto@vetcarecentral.cl');
  });
});
