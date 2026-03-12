import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreatePostDto } from './posts-dto/create-posts.dto';
import { UpdatePostDto } from './posts-dto/update-posts.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPost(userId: string, createPostDto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        ...createPostDto,
        authorId: userId,
      },
    });
  }

  async getPostById(userId: string, postId: string) {
    return this.prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        likeCount: true,
        commentCount: true,
        likes: {
          where: { userId },
          select: { userId: true },
        },
        comments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async updatePost(userId: string, postId: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.authorId !== userId) {
      throw new ForbiddenException();
    }

    return this.prisma.post.update({
      where: { id: postId },
      data: {
        content: dto.content,
        visibility: dto.visibility,
      },
    });
  }
  // Example of handling the Soft Delete

  async softDelete(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post || post.deletedAt !== null) {
      throw new NotFoundException('Post not found');
    }

    // Security: Ensure the user deleting the post actually owns it
    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    return this.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });
  }

  async getUserPosts(
    userId: string,
    viewerId: string,
    cursor?: string,
    limit = 20,
  ) {
    const posts = await this.prisma.post.findMany({
      take: limit + 1,

      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),

      where: {
        authorId: userId,
        deletedAt: null,
        ...(viewerId === userId ? {} : { visibility: 'PUBLIC' }),
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
        likes: {
          where: { userId: viewerId },
          select: { userId: true },
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

  async toggleLike(userId: string, postId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.prisma.postLike.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existingLike) {
      await this.prisma.$transaction([
        this.prisma.postLike.delete({
          where: { userId_postId: { userId, postId } },
        }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);
      return { liked: false };
    }

    await this.prisma.$transaction([
      this.prisma.postLike.create({ data: { userId, postId } }),
      this.prisma.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      }),
    ]);

    return { liked: true };
  }

  async addComment(userId: string, postId: string, content: string) {
    const trimmedContent = content?.trim();
    if (!trimmedContent) {
      throw new BadRequestException('Comment content is required');
    }

    const post = await this.prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const [comment] = await this.prisma.$transaction([
      this.prisma.comment.create({
        data: {
          authorId: userId,
          postId,
          content: trimmedContent,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      }),
    ]);

    return comment;
  }

  async getPostComments(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }
}
