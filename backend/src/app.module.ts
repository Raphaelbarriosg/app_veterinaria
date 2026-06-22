import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PetsModule } from './modules/pets/pets.module';
import { TreatmentsModule } from './modules/treatments/treatments.module';
import { DailyLogsModule } from './modules/daily-logs/daily-logs.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    PetsModule,
    TreatmentsModule,
    DailyLogsModule,
    CloudinaryModule,
    HealthModule,
  ],
})
export class AppModule {}
