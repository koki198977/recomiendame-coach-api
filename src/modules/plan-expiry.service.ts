import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../infrastructure/database/prisma.service';

@Injectable()
export class PlanExpiryService {
  private readonly logger = new Logger(PlanExpiryService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async downgradeExpiredPlans() {
    const result = await this.prisma.user.updateMany({
      where: {
        plan: 'PRO',
        planExpiresAt: { lt: new Date() },
      },
      data: {
        plan: 'FREE',
        stripeSubscriptionId: null,
      },
    });

    if (result.count > 0) {
      this.logger.log(`Degradados ${result.count} usuarios con plan expirado a FREE`);
    }
  }
}
