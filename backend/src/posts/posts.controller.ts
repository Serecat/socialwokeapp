import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Delete,
  Param,
  Get,
  Patch,
  Query,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './posts-dto/create-posts.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdatePostDto } from './posts-dto/update-posts.dto';

interface JwtUser {
  userId: string;
  email: string;
}

interface AuthRequest extends ExpressRequest {
  user: JwtUser;
}

@Controller('posts')
@UseGuards(JwtAuthGuard) // Protect all post routes
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Request() req: AuthRequest, @Body() createPostDto: CreatePostDto) {
    // req.user.id is populated securely by your JWT Auth Guard
    return this.postsService.createPost(req.user.userId, createPostDto);
  }

  @Get('me/posts')
  getMyPosts(@Request() req: AuthRequest, @Query('cursor') cursor?: string) {
    return this.postsService.getUserPosts(
      req.user.userId,
      req.user.userId,
      cursor,
    );
  }

  @Get('user/:userId/posts')
  getUserPosts(
    @Request() req: AuthRequest,
    @Param('userId') userId: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.postsService.getUserPosts(userId, req.user.userId, cursor);
  }

  @Get(':id')
  getPost(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.postsService.getPostById(req.user.userId, id);
  }

  @Patch(':id')
  updatePost(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.updatePost(req.user.userId, id, dto);
  }

  @Delete(':id')
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.postsService.softDelete(req.user.userId, id);
  }

  @Post(':id/likes')
  toggleLike(@Request() req: AuthRequest, @Param('id') postId: string) {
    return this.postsService.toggleLike(req.user.userId, postId);
  }

  @Post(':id/comments')
  addComment(
    @Request() req: AuthRequest,
    @Param('id') postId: string,
    @Body('content') content: string,
  ) {
    return this.postsService.addComment(req.user.userId, postId, content);
  }

  @Get(':id/comments')
  getComments(@Param('id') postId: string) {
    return this.postsService.getPostComments(postId);
  }
}
