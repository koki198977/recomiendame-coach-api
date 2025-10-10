import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ACHIEVEMENT_PORT, AchievementPort } from '../../../core/application/achievements/ports/out.achievement.port';

@Injectable()
export class AchievementPrismaRepository implements AchievementPort {
  constructor(private prisma: PrismaService) {}

  async has(userId: string, code: string): Promise<boolean> {
    const ach = await this.prisma.achievement.findUnique({ where: { code } });
    if (!ach) return false;
    const rel = await this.prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId: ach.id } },
    });
    return !!rel;
  }

  async unlock(userId: string, code: string): Promise<void> {
    const ach = await this.prisma.achievement.upsert({
      where: { code },
      update: {},
      create: { code, title: code, points: 0 }, // bootstrap si no existe
    });
    await this.prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId: ach.id } },
      update: {},
      create: { userId, achievementId: ach.id },
    });
  }

  async listUnlockedCodes(userId: string): Promise<string[]> {
    const rows = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: { select: { code: true } } },
      orderBy: { unlockedAt: 'asc' },
    });
    return rows.map(r => r.achievement.code);
  }
}
