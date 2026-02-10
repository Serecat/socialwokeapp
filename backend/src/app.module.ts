import { Module } from '@nestjs/common';
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

@Module({
  imports: [AuthModule, UsersModule, PostsModule, ChatModule, FeedsModule, SocialGraphModule, ModerationModule, CommonModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
