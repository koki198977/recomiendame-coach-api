import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class GetSubscriptionStatusUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        planExpiresAt: true,
        trialStartedAt: true,
        stripeSubscriptionId: true,
      },
    });
  }
}
