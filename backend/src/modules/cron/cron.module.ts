import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ControlVisitsModule } from '../control-visits/control-visits.module';

@Module({
  imports: [PrismaModule, ControlVisitsModule],
  providers: [CronService],
  exports: [CronService],
})
export class CronModule {}
