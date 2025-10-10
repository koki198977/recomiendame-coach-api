import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { POINTS_LEDGER_PORT, PointsLedgerPort } from '../../../core/application/stats/ports/out.points-ledger.port';

@Injectable()
export class PointsLedgerPrismaRepository implements PointsLedgerPort {
  constructor(private prisma: PrismaService) {}

  async add(userId: string, delta: number, reason: string, meta?: any): Promise<void> {
    await this.prisma.pointsLedger.create({
      data: { userId, delta, reason, meta: meta ?? undefined },
    });
  }

  async sum(userId: string): Promise<number> {
    const agg = await this.prisma.pointsLedger.aggregate({
      where: { userId },
      _sum: { delta: true },
    });
    return agg._sum.delta ?? 0;
  }
}
