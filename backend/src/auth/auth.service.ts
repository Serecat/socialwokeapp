import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegisterResponseDto } from './dto/register-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, pass: string): Promise<RegisterResponseDto> {
    const hashedPassword = await bcrypt.hash(pass, 10);

    const exists = await this.prisma.user.findUnique({
      where: { email },
    });

    if (exists) {
      throw new BadRequestException('Email already in use');
    }

    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword },
    });

    return {
      id: user.id,
      email: user.email,
    };
  }

  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const isMatch = user ? await bcrypt.compare(pass, user.password) : false;

    if (!isMatch || !user) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    const payload = { sub: user.id, email: user.email };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
