import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { HealthController } from './health.controller';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [PrismaService, RedisService],
  exports: [PrismaService, RedisService],
  controllers: [HealthController],
})
export class CommonModule {}
