import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './update-profile.dto';

interface JwtUser {
  userId: string;
}

interface AuthRequest extends ExpressRequest {
  user: JwtUser;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Request() req: AuthRequest) {
    return this.usersService.getMe(req.user.userId);
  }

  @Patch('me')
  async updateMe(@Request() req: AuthRequest, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @Get('search')
  async searchUsers(@Query('q') query?: string) {
    return this.usersService.searchUsers(query ?? '');
  }

  @Get(':id')
  async getUserProfile(
    @Param('id') targetUserId: string,
    @Request() req: AuthRequest,
  ) {
    return this.usersService.getProfileBasicsById(
      req.user.userId,
      targetUserId,
    );
  }
}
