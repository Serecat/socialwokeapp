import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('ready')
  async ready() {
    try {
      // Minimal DB check
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', db: 'ok' };
    } catch (err){
       console.error('Readiness check failed (DB):', err); 
      throw new ServiceUnavailableException({ status: 'not_ready', db: 'down' });
    }
  }
}