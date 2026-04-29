import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SocialGraphService {
  constructor(private readonly prisma: PrismaService) {}

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: followingId },
      select: { isPrivate: true },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (target.isPrivate) {
      const existing = await this.prisma.followRequest.findUnique({
        where: {
          fromUserId_toUserId: {
            fromUserId: followerId,
            toUserId: followingId,
          },
        },
      });

      if (existing) {
        if (existing.status === 'PENDING') {
          return { status: 'requested' };
        }
        // Re-request if previously rejected
        await this.prisma.followRequest.update({
          where: { id: existing.id },
          data: { status: 'PENDING' },
        });
      } else {
        await this.prisma.followRequest.create({
          data: { fromUserId: followerId, toUserId: followingId },
        });
      }

      return { status: 'requested' };
    }

    // Public account – create Follow directly (upsert to be idempotent)
    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId, followingId },
      },
      create: { followerId, followingId },
      update: {},
    });

    return { status: 'following' };
  }

  async unfollow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot unfollow yourself');
    }

    // Remove Follow record if exists
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (follow) {
      await this.prisma.follow.delete({
        where: { followerId_followingId: { followerId, followingId } },
      });
      return { status: 'unfollowed' };
    }

    // Cancel pending follow request if exists
    const request = await this.prisma.followRequest.findUnique({
      where: {
        fromUserId_toUserId: { fromUserId: followerId, toUserId: followingId },
      },
    });

    if (request && request.status === 'PENDING') {
      await this.prisma.followRequest.delete({ where: { id: request.id } });
      return { status: 'request_cancelled' };
    }

    return { status: 'not_following' };
  }

  async getFollowers(userId: string, cursor?: string, limit = 20) {
    const followers = await this.prisma.follow.findMany({
      where: { followingId: userId },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: {
              followerId_followingId: {
                followerId: cursor,
                followingId: userId,
              },
            },
            skip: 1,
          }
        : {}),
      orderBy: { createdAt: 'desc' },
      select: {
        follower: {
          select: { id: true, firstName: true, lastName: true },
        },
        createdAt: true,
        followerId: true,
      },
    });

    const hasMore = followers.length > limit;
    const items = hasMore ? followers.slice(0, limit) : followers;
    const nextCursor = hasMore ? items[items.length - 1].followerId : null;

    return {
      data: items.map((f) => f.follower),
      nextCursor,
    };
  }

  async getFollowing(userId: string, cursor?: string, limit = 20) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: {
              followerId_followingId: {
                followerId: userId,
                followingId: cursor,
              },
            },
            skip: 1,
          }
        : {}),
      orderBy: { createdAt: 'desc' },
      select: {
        following: {
          select: { id: true, firstName: true, lastName: true },
        },
        createdAt: true,
        followingId: true,
      },
    });

    const hasMore = following.length > limit;
    const items = hasMore ? following.slice(0, limit) : following;
    const nextCursor = hasMore ? items[items.length - 1].followingId : null;

    return {
      data: items.map((f) => f.following),
      nextCursor,
    };
  }

  async getFollowRequests(userId: string) {
    const requests = await this.prisma.followRequest.findMany({
      where: { toUserId: userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fromUser: {
          select: { id: true, firstName: true, lastName: true },
        },
        createdAt: true,
      },
    });

    return requests;
  }

  async acceptFollowRequest(requestId: string, userId: string) {
    const request = await this.prisma.followRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Follow request not found');
    }

    if (request.toUserId !== userId) {
      throw new ForbiddenException('Not your follow request');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Follow request is not pending');
    }

    await this.prisma.$transaction([
      this.prisma.followRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      }),
      this.prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: request.fromUserId,
            followingId: request.toUserId,
          },
        },
        create: {
          followerId: request.fromUserId,
          followingId: request.toUserId,
        },
        update: {},
      }),
    ]);

    return { status: 'accepted' };
  }

  async rejectFollowRequest(requestId: string, userId: string) {
    const request = await this.prisma.followRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Follow request not found');
    }

    if (request.toUserId !== userId) {
      throw new ForbiddenException('Not your follow request');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Follow request is not pending');
    }

    await this.prisma.followRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    return { status: 'rejected' };
  }
}
