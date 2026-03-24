import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

type UserProfileBasics = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfileBasicsById(userId: string): Promise<UserProfileBasics> {
    const user = (await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    })) as UserProfileBasics | null;

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
  async searchUsers(query: string, limit = 10) {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: trimmedQuery, mode: 'insensitive' } },
          { lastName: { contains: trimmedQuery, mode: 'insensitive' } },
          { email: { contains: trimmedQuery, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });
  }
}
