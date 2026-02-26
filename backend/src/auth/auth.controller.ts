import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterResponseDto } from './dto/register-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register') // POST /auth/register
  async register(@Body() body: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(body.email, body.password);
  }

  @Post('login') // POST /auth/login
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }
}
