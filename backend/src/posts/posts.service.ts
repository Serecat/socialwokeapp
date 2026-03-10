import {
  Injectable,
  NotFoundException,
  ForbiddenException,
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

  async getPostById(postId: string) {
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

  async getUserPosts(userId: string, cursor?: string, limit = 20) {
    const posts = await this.prisma.post.findMany({
      take: limit + 1,

      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),

      where: {
        authorId: userId,
        deletedAt: null,
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
