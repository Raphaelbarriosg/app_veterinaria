import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PetsModule } from './modules/pets/pets.module';
import { TreatmentsModule } from './modules/treatments/treatments.module';
import { DailyLogsModule } from './modules/daily-logs/daily-logs.module';
import { HealthModule } from './health/health.module';
import { AuditModule } from './common/services/audit.module';
import { ClinicsModule } from './modules/clinics/clinics.module';
import { UploadModule } from './modules/upload/upload.module';
import { MailModule } from './modules/mail/mail.module';
import { CronModule } from './modules/cron/cron.module';
import { EmergencyModule } from './modules/emergency/emergency.module';

// Nuevos módulos post-op refactorizados
import { MedicationLogsModule } from './modules/medication-logs/medication-logs.module';
import { ControlVisitsModule } from './modules/control-visits/control-visits.module';
import { PostOpProtocolsModule } from './modules/post-op-protocols/post-op-protocols.module';
import { DischargeSheetsModule } from './modules/discharge-sheets/discharge-sheets.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'medium', ttl: 10000, limit: 20 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    PetsModule,
    TreatmentsModule,
    DailyLogsModule,
    HealthModule,
    AuditModule,
    ClinicsModule,
    UploadModule,
    MailModule,
    CronModule,
    EmergencyModule,
    MedicationLogsModule,
    ControlVisitsModule,
    PostOpProtocolsModule,
    DischargeSheetsModule,
    NotificationsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}