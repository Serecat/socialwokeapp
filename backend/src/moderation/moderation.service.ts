import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async banUser(adminId: string, targetUserId: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, bannedAt: true, role: true },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (target.role === 'ADMIN') {
      throw new BadRequestException('Cannot ban another admin');
    }

    const bannedAt = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: targetUserId },
        data: { bannedAt },
      }),
      this.prisma.auditLog.create({
        data: {
          adminId,
          action: 'BAN_USER',
          targetType: 'User',
          targetId: targetUserId,
          metadata: { bannedAt: bannedAt.toISOString() },
        },
      }),
    ]);

    return { message: 'User banned', bannedAt };
  }

  async unbanUser(adminId: string, targetUserId: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, bannedAt: true },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (!target.bannedAt) {
      throw new BadRequestException('User is not banned');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: targetUserId },
        data: { bannedAt: null },
      }),
      this.prisma.auditLog.create({
        data: {
          adminId,
          action: 'UNBAN_USER',
          targetType: 'User',
          targetId: targetUserId,
        },
      }),
    ]);

    return { message: 'User unbanned' };
  }

  async deletePost(adminId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, deletedAt: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.deletedAt) {
      throw new BadRequestException('Post is already deleted');
    }

    const deletedAt = new Date();

    await this.prisma.$transaction([
      this.prisma.post.update({
        where: { id: postId },
        data: { deletedAt },
      }),
      this.prisma.auditLog.create({
        data: {
          adminId,
          action: 'DELETE_POST',
          targetType: 'Post',
          targetId: postId,
          metadata: { deletedAt: deletedAt.toISOString() },
        },
      }),
    ]);

    return { message: 'Post removed' };
  }

  async getAuditLogs(cursor?: string, limit = 20) {
    const logs = await this.prisma.auditLog.findMany({
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        metadata: true,
        createdAt: true,
        admin: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const hasMore = logs.length > limit;
    const items = hasMore ? logs.slice(0, limit) : logs;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return { data: items, nextCursor };
  }
}
