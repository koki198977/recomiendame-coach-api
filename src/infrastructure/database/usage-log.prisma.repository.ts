import { Injectable } from '@nestjs/common';
import { IUsageLogPort } from '../../core/application/plan/ports/out.usage-log.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class UsageLogPrismaRepository implements IUsageLogPort {
  constructor(private readonly prisma: PrismaService) {}

  async getCount(userId: string, feature: string, from: Date, to: Date): Promise<number> {
    const result = await this.prisma.usageLog.aggregate({
      _sum: { count: true },
      where: { userId, feature, date: { gte: from, lt: to } },
    });
    return result._sum.count ?? 0;
  }

  async increment(userId: string, feature: string): Promise<void> {
    await this.prisma.usageLog.create({ data: { userId, feature } });
  }
}
