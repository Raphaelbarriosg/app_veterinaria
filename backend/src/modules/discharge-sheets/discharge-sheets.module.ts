import { Module } from '@nestjs/common';
import { DischargeSheetsService } from './discharge-sheets.service';
import { DischargeSheetsController } from './discharge-sheets.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DischargeSheetsController],
  providers: [DischargeSheetsService],
  exports: [DischargeSheetsService],
})
export class DischargeSheetsModule {}
