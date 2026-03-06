import {
  Controller,
  Get,
  UnauthorizedException,
  Headers,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('me')
  async getMe(@Headers('authorization') authorization?: string) {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const token = authorization.replace('Bearer ', '').trim();

    try {
      const payload = await this.jwtService.verifyAsync<{ sub?: string }>(
        token,
      );

      if (!payload.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }

      return this.usersService.getProfileBasicsById(payload.sub);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
