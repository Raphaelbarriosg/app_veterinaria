import { Test, TestingModule } from '@nestjs/testing';
import { CronService } from './cron.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ControlVisitsService } from '../control-visits/control-visits.service';

const mockPrismaService = {
  refreshToken: {
    deleteMany: jest.fn(),
  },
  medicationLog: {
    findMany: jest.fn(),
  },
};

const mockNotificationsService = {
  sendMedicationReminder: jest.fn(),
};

const mockControlVisitsService = {
  sendUpcomingReminders: jest.fn(),
};

describe('CronService', () => {
  let service: CronService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: ControlVisitsService, useValue: mockControlVisitsService },
      ],
    }).compile();

    service = module.get<CronService>(CronService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('cleanExpiredRefreshTokens', () => {
    it('should delete expired or revoked refresh tokens', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 5 });

      await service.cleanExpiredRefreshTokens();

      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { expiresAt: { lt: expect.any(Date) } },
            { isRevoked: true },
          ],
        },
      });
    });
  });

  describe('sendUpcomingMedicationReminders', () => {
    it('debe buscar y despachar recordatorios para dosis pendientes', async () => {
      mockPrismaService.medicationLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          treatmentId: 'treatment-1',
          rule: { medicineName: 'Meloxicam', dosage: '1 ml' },
          treatment: {
            status: 'ACTIVE',
            pet: { ownerId: 'owner-1', name: 'Thor' },
          },
        },
      ]);

      await service.sendUpcomingMedicationReminders();

      expect(mockNotificationsService.sendMedicationReminder).toHaveBeenCalledWith({
        ownerId: 'owner-1',
        petName: 'Thor',
        medicationName: 'Meloxicam',
        dosage: '1 ml',
        treatmentId: 'treatment-1',
      });
    });
  });

  describe('sendDailyControlVisitReminders', () => {
    it('debe invocar sendUpcomingReminders del servicio de control', async () => {
      mockControlVisitsService.sendUpcomingReminders.mockResolvedValue({ reminded: 3 });

      await service.sendDailyControlVisitReminders();

      expect(mockControlVisitsService.sendUpcomingReminders).toHaveBeenCalled();
    });
  });
});
