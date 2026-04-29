import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;
}

interface JwtUser {
  userId: string;
}

interface AuthRequest extends ExpressRequest {
  user: JwtUser;
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  getConversations(@Req() req: AuthRequest) {
    return this.chatService.getConversations(req.user.userId);
  }

  @Get(':userId/messages')
  getMessages(
    @Req() req: AuthRequest,
    @Param('userId') partnerId: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.chatService.getMessages(req.user.userId, partnerId, cursor);
  }

  @Post(':userId/messages')
  sendMessage(
    @Req() req: AuthRequest,
    @Param('userId') receiverId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.saveMessage(
      req.user.userId,
      receiverId,
      dto.content,
    );
  }
}
