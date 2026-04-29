import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UpdateProfileDto } from './update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        bio: true,
        isPrivate: true,
        role: true,
        gdprConsent: true,
        interests: {
          select: {
            interest: { select: { id: true, name: true, slug: true } },
          },
        },
        _count: {
          select: { followers: true, following: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { _count, interests, ...rest } = user;

    return {
      ...rest,
      followerCount: _count.followers,
      followingCount: _count.following,
      interests: interests.map((ui) => ui.interest),
    };
  }

  async getProfileBasicsById(requesterId: string | null, targetUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        bio: true,
        isPrivate: true,
        interests: {
          select: {
            interest: { select: { id: true, name: true, slug: true } },
          },
        },
        _count: {
          select: { followers: true, following: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { _count, interests, ...rest } = user;
    const base = {
      ...rest,
      followerCount: _count.followers,
      followingCount: _count.following,
      interests: interests.map((ui) => ui.interest),
    };

    if (requesterId !== null && requesterId !== targetUserId) {
      const followStatus = await this.getFollowStatus(
        requesterId,
        targetUserId,
      );

      if (user.isPrivate && followStatus !== 'following') {
        return {
          id: base.id,
          firstName: base.firstName,
          lastName: base.lastName,
          isPrivate: true as const,
          followerCount: base.followerCount,
          followingCount: base.followingCount,
          followStatus,
        };
      }

      return { ...base, followStatus };
    }

    return base;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { interestIds, ...profileFields } = dto;

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      if (interestIds !== undefined) {
        await tx.userInterest.deleteMany({ where: { userId } });
        if (interestIds.length > 0) {
          await tx.userInterest.createMany({
            data: interestIds.map((interestId) => ({ userId, interestId })),
            skipDuplicates: true,
          });
        }
      }

      return tx.user.update({
        where: { id: userId },
        data: profileFields,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          bio: true,
          isPrivate: true,
          interests: {
            select: {
              interest: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      });
    });

    const { interests, ...rest } = updatedUser;
    return { ...rest, interests: interests.map((ui) => ui.interest) };
  }

  async searchUsers(query: string, limit = 10) {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: trimmedQuery, mode: 'insensitive' } },
          { lastName: { contains: trimmedQuery, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });
  }

  async getFollowStatus(
    requesterId: string,
    targetUserId: string,
  ): Promise<'following' | 'requested' | 'none'> {
    if (requesterId === targetUserId) return 'none';

    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: requesterId,
          followingId: targetUserId,
        },
      },
    });

    if (follow) return 'following';

    const request = await this.prisma.followRequest.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: requesterId,
          toUserId: targetUserId,
        },
      },
    });

    return request?.status === 'PENDING' ? 'requested' : 'none';
  }

  assertOwnership(requesterId: string, targetUserId: string) {
    if (requesterId !== targetUserId) {
      throw new ForbiddenException('Access denied');
    }
  }
}
