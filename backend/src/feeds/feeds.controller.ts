import { Controller } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UseGuards, Get, Query, Req } from '@nestjs/common';
import { FeedService } from './feeds.service';
import { Request as ExpressRequest } from 'express';

interface JwtUser {
  userId: string;
}

interface AuthRequest extends ExpressRequest {
  user: JwtUser;
}

@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  getFeed(@Req() req: AuthRequest, @Query('cursor') cursor?: string) {
    return this.feedService.getFeed(req.user.userId, cursor);
  }
  @Get('global')
  getGlobalFeed(@Req() req: AuthRequest, @Query('cursor') cursor?: string) {
    return this.feedService.getGlobalFeed(req.user.userId, cursor);
  }
}
