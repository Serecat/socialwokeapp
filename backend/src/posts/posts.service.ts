import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreatePostDto } from './posts-dto/create-posts.dto';

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
}
