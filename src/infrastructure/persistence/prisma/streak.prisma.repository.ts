import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { STREAK_REPOSITORY, StreakRepositoryPort } from '../../../core/application/stats/ports/out.streak-repository.port';

@Injectable()
export class StreakPrismaRepository implements StreakRepositoryPort {
  constructor(private prisma: PrismaService) {}

  async getDays(userId: string): Promise<number> {
    const s = await this.prisma.streak.findUnique({ where: { userId } });
    return s?.days ?? 0;
  }

  async setDays(userId: string, days: number): Promise<void> {
    await this.prisma.streak.upsert({
      where: { userId },
      update: { days },
      create: { userId, days },
    });
  }
}
