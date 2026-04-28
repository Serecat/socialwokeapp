import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.client = new Redis(redisUrl ?? 'redis://localhost:6379', {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected');
    });

    this.client.on('error', (err: Error) => {
      this.logger.error('Redis connection error', err.message);
    });

    void this.client.connect().catch((err: Error) => {
      this.logger.warn(`Redis initial connect failed: ${err.message}`);
    });
  }

  onModuleDestroy(): void {
    this.client.disconnect();
  }

  getClient(): Redis {
    return this.client;
  }
}
