import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

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
    return this.usersService.getProfileBasicsById(req.user.userId);
  }
  @Get('search')
  async searchUsers(@Query('q') query?: string) {
    return this.usersService.searchUsers(query ?? '');
  }
  @Get(':id')
  async getUserProfile(@Param('id') userId: string) {
    return this.usersService.getProfileBasicsById(userId);
  }
}
