import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ModerationService } from './moderation.service';

interface JwtUser {
  userId: string;
  role: string;
}

interface AuthRequest extends ExpressRequest {
  user: JwtUser;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('users/:id/ban')
  banUser(@Req() req: AuthRequest, @Param('id') targetId: string) {
    return this.moderationService.banUser(req.user.userId, targetId);
  }

  @Post('users/:id/unban')
  unbanUser(@Req() req: AuthRequest, @Param('id') targetId: string) {
    return this.moderationService.unbanUser(req.user.userId, targetId);
  }

  @Delete('posts/:id')
  deletePost(@Req() req: AuthRequest, @Param('id') postId: string) {
    return this.moderationService.deletePost(req.user.userId, postId);
  }

  @Get('audit-logs')
  getAuditLogs(@Query('cursor') cursor?: string) {
    return this.moderationService.getAuditLogs(cursor);
  }
}
