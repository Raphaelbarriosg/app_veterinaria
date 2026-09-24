import { Module } from '@nestjs/common';
import { ClinicsController } from './clinics.controller';
import { InvitationsController } from './invitations.controller';
import { ClinicsService } from './clinics.service';

@Module({
  controllers: [ClinicsController, InvitationsController],
  providers: [ClinicsService],
  exports: [ClinicsService],
})
export class ClinicsModule {}