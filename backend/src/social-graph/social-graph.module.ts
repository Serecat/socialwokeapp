import { Module } from '@nestjs/common';
import { SocialGraphService } from './social-graph.service';
import { SocialGraphController } from './social-graph.controller';

@Module({
  providers: [SocialGraphService],
  controllers: [SocialGraphController]
})
export class SocialGraphModule {}
