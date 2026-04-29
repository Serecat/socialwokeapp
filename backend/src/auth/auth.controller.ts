import { Controller, Post, Body, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './auth-dto/register.dto';
import { LoginDto } from './auth-dto/login.dto';
import { RegisterResponseDto } from './auth-dto/register-response.dto';

@Throttle({ default: { ttl: 60_000, limit: 5 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register') // POST /auth/register
  async register(@Body() body: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(
      body.email,
      body.password,
      body.firstName,
      body.lastName,
      body.interestIds,
    );
  }

  @Post('login') // POST /auth/login
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(body.email, body.password, res);
  }

  @Post('refresh') // POST /auth/refresh
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.['refresh_token'] as string | undefined;
    return this.authService.refresh(token, res);
  }

  @Post('logout') // POST /auth/logout
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.['refresh_token'] as string | undefined;
    return this.authService.logout(token, res);
  }
}
