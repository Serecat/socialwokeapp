import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async saveMessage(senderId: string, receiverId: string, content: string) {
    return this.prisma.chatMessage.create({
      data: { senderId, receiverId, content },
      select: {
        id: true,
        content: true,
        createdAt: true,
        sender: { select: { id: true, firstName: true, lastName: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getConversations(userId: string) {
    // Find the most recent message per distinct conversation partner
    const sent = await this.prisma.chatMessage.findMany({
      where: { senderId: userId },
      distinct: ['receiverId'],
      orderBy: { createdAt: 'desc' },
      select: {
        receiverId: true,
        receiver: { select: { id: true, firstName: true, lastName: true } },
        content: true,
        createdAt: true,
      },
    });

    const received = await this.prisma.chatMessage.findMany({
      where: { receiverId: userId },
      distinct: ['senderId'],
      orderBy: { createdAt: 'desc' },
      select: {
        senderId: true,
        sender: { select: { id: true, firstName: true, lastName: true } },
        content: true,
        createdAt: true,
      },
    });

    // Merge and deduplicate by partner userId, keeping latest message
    const partnersMap = new Map<
      string,
      {
        user: { id: string; firstName: string; lastName: string };
        lastMessage: string;
        lastAt: Date;
      }
    >();

    for (const s of sent) {
      const p = s.receiverId;
      if (!partnersMap.has(p) || s.createdAt > partnersMap.get(p)!.lastAt) {
        partnersMap.set(p, {
          user: s.receiver,
          lastMessage: s.content,
          lastAt: s.createdAt,
        });
      }
    }

    for (const r of received) {
      const p = r.senderId;
      if (!partnersMap.has(p) || r.createdAt > partnersMap.get(p)!.lastAt) {
        partnersMap.set(p, {
          user: r.sender,
          lastMessage: r.content,
          lastAt: r.createdAt,
        });
      }
    }

    return Array.from(partnersMap.values()).sort(
      (a, b) => b.lastAt.getTime() - a.lastAt.getTime(),
    );
  }

  async getMessages(
    userId: string,
    partnerId: string,
    cursor?: string,
    limit = 30,
  ) {
    const messages = await this.prisma.chatMessage.findMany({
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        sender: { select: { id: true, firstName: true, lastName: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return { data: items, nextCursor };
  }
}
