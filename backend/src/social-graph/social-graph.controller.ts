import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SocialGraphService } from './social-graph.service';

interface JwtUser {
  userId: string;
}

interface AuthRequest extends ExpressRequest {
  user: JwtUser;
}

@Controller('social-graph')
@UseGuards(JwtAuthGuard)
export class SocialGraphController {
  constructor(private readonly socialGraphService: SocialGraphService) {}

  @Post('follow/:userId')
  async follow(
    @Param('userId') targetUserId: string,
    @Request() req: AuthRequest,
  ) {
    return this.socialGraphService.follow(req.user.userId, targetUserId);
  }

  @Delete('follow/:userId')
  async unfollow(
    @Param('userId') targetUserId: string,
    @Request() req: AuthRequest,
  ) {
    return this.socialGraphService.unfollow(req.user.userId, targetUserId);
  }

  @Get('followers/:userId')
  async getFollowers(
    @Param('userId') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialGraphService.getFollowers(
      userId,
      cursor,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('following/:userId')
  async getFollowing(
    @Param('userId') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialGraphService.getFollowing(
      userId,
      cursor,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('follow-requests')
  async getFollowRequests(@Request() req: AuthRequest) {
    return this.socialGraphService.getFollowRequests(req.user.userId);
  }

  @Post('follow-requests/:requestId/accept')
  async acceptFollowRequest(
    @Param('requestId') requestId: string,
    @Request() req: AuthRequest,
  ) {
    return this.socialGraphService.acceptFollowRequest(
      requestId,
      req.user.userId,
    );
  }

  @Post('follow-requests/:requestId/reject')
  async rejectFollowRequest(
    @Param('requestId') requestId: string,
    @Request() req: AuthRequest,
  ) {
    return this.socialGraphService.rejectFollowRequest(
      requestId,
      req.user.userId,
    );
  }
}
