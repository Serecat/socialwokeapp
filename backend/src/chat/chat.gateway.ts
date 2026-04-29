import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

interface JwtPayload {
  sub: string;
  email: string;
}

interface AuthenticatedSocket extends Socket {
  userId: string;
}

interface SendMessagePayload {
  receiverId: string;
  content: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      // Token is passed in the auth object during handshake (NOT in query params)
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      client.userId = payload.sub;

      // Join the user's personal channel so they can receive messages
      await client.join(`user:${payload.sub}`);
      this.logger.log(`Client ${payload.sub} connected`);
    } catch {
      this.logger.warn(`Unauthorized WebSocket connection attempt`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    this.logger.log(`Client ${client.userId ?? 'unknown'} disconnected`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    if (!client.userId) return;
    if (!payload?.receiverId || !payload?.content?.trim()) return;

    const message = await this.chatService.saveMessage(
      client.userId,
      payload.receiverId,
      payload.content.trim(),
    );

    // Deliver to recipient if they are online
    this.server.to(`user:${payload.receiverId}`).emit('newMessage', message);

    // Confirm delivery to sender
    client.emit('messageSent', message);
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { partnerId: string },
  ) {
    if (!client.userId || !payload?.partnerId) return;
    // No additional room needed — users already joined their personal channel on connect
    client.emit('joined', { partnerId: payload.partnerId });
  }
}
