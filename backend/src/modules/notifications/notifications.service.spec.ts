import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

const mockPrismaService = {
  deviceToken: {
    upsert: jest.fn(),
    updateMany: jest.fn(),
    findMany: jest.fn(),
  },
  clinicMember: {
    findMany: jest.fn(),
  },
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('registerToken', () => {
    it('debe registrar o actualizar un token de dispositivo', async () => {
      mockPrismaService.deviceToken.upsert.mockResolvedValue({
        id: 'token-uuid-1',
        userId: 'user-1',
        token: 'fcm-token-123',
        platform: 'android',
        isActive: true,
      });

      const result = await service.registerToken('user-1', {
        token: 'fcm-token-123',
        platform: 'android',
      });

      expect(mockPrismaService.deviceToken.upsert).toHaveBeenCalledWith({
        where: { token: 'fcm-token-123' },
        create: {
          userId: 'user-1',
          token: 'fcm-token-123',
          platform: 'android',
          isActive: true,
        },
        update: {
          userId: 'user-1',
          platform: 'android',
          isActive: true,
          updatedAt: expect.any(Date),
        },
      });
      expect(result.success).toBe(true);
      expect(result.platform).toBe('android');
    });
  });

  describe('removeToken', () => {
    it('debe marcar el token como inactivo', async () => {
      mockPrismaService.deviceToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.removeToken('user-1', 'fcm-token-123');

      expect(mockPrismaService.deviceToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', token: 'fcm-token-123' },
        data: { isActive: false },
      });
      expect(result.success).toBe(true);
      expect(result.revoked).toBe(true);
    });
  });

  describe('getUserTokens', () => {
    it('debe retornar la lista de tokens activos', async () => {
      const mockTokens = [
        { id: '1', token: 'token-a', platform: 'android', createdAt: new Date(), updatedAt: new Date() },
      ];
      mockPrismaService.deviceToken.findMany.mockResolvedValue(mockTokens);

      const result = await service.getUserTokens('user-1');

      expect(result).toEqual(mockTokens);
      expect(mockPrismaService.deviceToken.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isActive: true },
        select: expect.any(Object),
      });
    });
  });

  describe('sendToUser', () => {
    it('debe despachar notificación a dispositivos activos en modo Dry-Run', async () => {
      mockPrismaService.deviceToken.findMany.mockResolvedValue([
        { token: 'device-token-1', platform: 'android' },
        { token: 'device-token-2', platform: 'ios' },
      ]);

      const result = await service.sendToUser('user-1', {
        title: 'Prueba',
        body: 'Cuerpo de prueba',
      });

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('debe retornar 0 enviados si el usuario no tiene dispositivos activos', async () => {
      mockPrismaService.deviceToken.findMany.mockResolvedValue([]);

      const result = await service.sendToUser('user-without-devices', {
        title: 'Prueba',
        body: 'Sin dispositivos',
      });

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  describe('sendEmergencyAlert', () => {
    it('debe notificar a veterinarios y administradores de la clínica', async () => {
      mockPrismaService.clinicMember.findMany.mockResolvedValue([
        { userId: 'vet-1' },
      ]);
      mockPrismaService.deviceToken.findMany.mockResolvedValue([
        { token: 'token-vet', platform: 'android' },
      ]);

      await service.sendEmergencyAlert({
        clinicId: 'clinic-1',
        petName: 'Thor',
        ownerName: 'Juan Pérez',
        severity: 'CRITICAL',
        symptoms: 'Dificultad respiratoria severa',
      });

      expect(mockPrismaService.clinicMember.findMany).toHaveBeenCalledWith({
        where: { clinicId: 'clinic-1', role: Role.VET, isActive: true },
        select: { userId: true },
      });
      expect(mockPrismaService.clinicMember.findMany).toHaveBeenCalledWith({
        where: { clinicId: 'clinic-1', role: Role.CLINIC_ADMIN, isActive: true },
        select: { userId: true },
      });
    });
  });

  describe('sendMedicationReminder', () => {
    it('debe despachar recordatorio al dueño con dosis', async () => {
      mockPrismaService.deviceToken.findMany.mockResolvedValue([
        { token: 'owner-token', platform: 'android' },
      ]);

      const result = await service.sendMedicationReminder({
        ownerId: 'owner-1',
        petName: 'Pelusa',
        medicationName: 'Amoxicilina',
        dosage: '250mg',
        treatmentId: 'treatment-1',
      });

      expect(result.sent).toBe(1);
    });
  });

  describe('sendControlVisitReminder', () => {
    it('debe despachar recordatorio de visita de control al dueño', async () => {
      mockPrismaService.deviceToken.findMany.mockResolvedValue([
        { token: 'owner-token', platform: 'ios' },
      ]);

      const result = await service.sendControlVisitReminder({
        ownerId: 'owner-1',
        petName: 'Pelusa',
        visitType: 'Retiro de puntos',
        scheduledAt: new Date(),
        treatmentId: 'treatment-1',
      });

      expect(result.sent).toBe(1);
    });
  });
});
