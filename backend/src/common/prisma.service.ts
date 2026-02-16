import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

type PrismaLifecycleClient = {
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
};

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    const prismaClient = this as unknown as PrismaLifecycleClient;
    await prismaClient.$connect();
  }

  async onModuleDestroy() {
    const prismaClient = this as unknown as PrismaLifecycleClient;
    await prismaClient.$disconnect();
  }
}
