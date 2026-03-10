import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class FeedService {
  constructor(private prisma: PrismaService) {}

  async getFeed(userId: string, cursor?: string, limit = 20) {
    const posts = await this.prisma.post.findMany({
      take: limit + 1,

      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),

      where: {
        deletedAt: null,
        author: {
          followers: {
            some: {
              followerId: userId,
            },
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },

      select: {
        id: true,
        content: true,
        createdAt: true,
        likeCount: true,
        commentCount: true,

        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;

    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem!.id;
    }

    return {
      data: posts,
      nextCursor,
    };
  }
  async getGlobalFeed(cursor?: string, limit = 20) {
    const posts = await this.prisma.post.findMany({
      take: limit + 1,

      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),

      where: {
        deletedAt: null,
        visibility: 'PUBLIC',
      },

      orderBy: {
        createdAt: 'desc',
      },

      select: {
        id: true,
        content: true,
        createdAt: true,
        likeCount: true,
        commentCount: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;

    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem!.id;
    }

    return {
      data: posts,
      nextCursor,
    };
  }
}
