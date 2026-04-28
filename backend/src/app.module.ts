import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { ChatModule } from './chat/chat.module';
import { FeedsModule } from './feeds/feeds.module';
import { SocialGraphModule } from './social-graph/social-graph.module';
import { ModerationModule } from './moderation/moderation.module';
import { CommonModule } from './common/common.module';
import { appConfig, validationSchema } from './common/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{ ttl: 60_000, limit: 60 }],
        storage: new ThrottlerStorageRedisService(
          config.get<string>('REDIS_URL') ?? 'redis://localhost:6379',
        ),
      }),
    }),
    AuthModule,
    UsersModule,
    PostsModule,
    ChatModule,
    FeedsModule,
    SocialGraphModule,
    ModerationModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
