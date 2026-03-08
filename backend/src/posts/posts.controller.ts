import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Delete,
  Param,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './posts-dto/create-posts.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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

  @Delete(':id')
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.postsService.softDelete(req.user.userId, id);
  }
}
