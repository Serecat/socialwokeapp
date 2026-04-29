import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import type { Response } from 'express';
import { RegisterResponseDto } from './auth-dto/register-response.dto';

const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    email: string,
    pass: string,
    firstName: string,
    lastName: string,
    interestIds?: string[],
  ): Promise<RegisterResponseDto> {
    const hashedPassword = await bcrypt.hash(pass, 10);

    const exists = await this.prisma.user.findUnique({
      where: { email },
    });

    if (exists) {
      throw new BadRequestException('Email already in use');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        ...(interestIds && interestIds.length > 0
          ? {
              interests: {
                create: interestIds.map((interestId) => ({ interestId })),
              },
            }
          : {}),
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  async login(email: string, pass: string, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const isMatch = user ? await bcrypt.compare(pass, user.password) : false;

    if (!isMatch || !user) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    const rawRefreshToken = this.generateRefreshToken();
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    this.setRefreshCookie(res, rawRefreshToken, expiresAt);

    return { access_token: accessToken };
  }

  async refresh(rawRefreshToken: string | undefined, res: Response) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('No refresh token');
    }

    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const newRawToken = this.generateRefreshToken();
    const newTokenHash = this.hashToken(newRawToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await this.prisma.$transaction([
      this.prisma.refreshToken.delete({ where: { tokenHash } }),
      this.prisma.refreshToken.create({
        data: { userId: stored.userId, tokenHash: newTokenHash, expiresAt },
      }),
    ]);

    const payload = { sub: stored.user.id, email: stored.user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    this.setRefreshCookie(res, newRawToken, expiresAt);

    return { access_token: accessToken };
  }

  async logout(rawRefreshToken: string | undefined, res: Response) {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
    }

    res.clearCookie('refresh_token', { path: '/auth' });

    return { message: 'Logged out' };
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private setRefreshCookie(res: Response, token: string, expires: Date): void {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires,
      path: '/auth',
    });
  }
}
