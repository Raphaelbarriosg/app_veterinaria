import { Module } from '@nestjs/common';
import { ControlVisitsService } from './control-visits.service';
import { ControlVisitsController } from './control-visits.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [ControlVisitsController],
  providers: [ControlVisitsService],
  exports: [ControlVisitsService],
})
export class ControlVisitsModule {}
