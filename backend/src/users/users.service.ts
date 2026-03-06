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
}
