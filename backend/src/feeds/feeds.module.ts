import { Module } from '@nestjs/common';
import { FeedController } from './feeds.controller';
import { FeedService } from './feeds.service';

@Module({
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedsModule {}
