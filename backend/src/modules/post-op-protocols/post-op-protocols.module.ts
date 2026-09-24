import { Module } from '@nestjs/common';
import { PostOpProtocolsService } from './post-op-protocols.service';
import { PostOpProtocolsController } from './post-op-protocols.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PostOpProtocolsController],
  providers: [PostOpProtocolsService],
  exports: [PostOpProtocolsService],
})
export class PostOpProtocolsModule {}
