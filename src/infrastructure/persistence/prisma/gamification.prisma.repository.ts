import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GAMIFICATION_REPO, GamificationRepoPort } from '../../../core/application/gamification/ports/out.gamification-repo.port';
import { ACHIEVEMENTS } from '../../../core/domain/gamification/achievements';

@Injectable()
export class GamificationPrismaRepository implements GamificationRepoPort {
  constructor(private prisma: PrismaService) {}

  /**
   * Llamado tras confirmar un check-in en una fecha (única por día).
   * Actualiza racha, agrega puntos, desbloquea logros.
   */
  async onDailyCheckin(input: { userId: string; date: Date }) {
    const { userId, date } = input;
    const day = this.stripTimeUTC(date);

    return this.prisma.$transaction(async (tx) => {
      // 1) racha actual
      const existing = await tx.streak.findUnique({ where: { userId } });

      // Verificamos si hubo checkin ayer
      const yesterday = new Date(day); yesterday.setUTCDate(day.getUTCDate() - 1);

      // ¿Ya había checkin hoy? (evitar múltiple puntuación si tu flujo lo permite)
      const already = await tx.checkin.findFirst({ where: { userId, date: day } });
      const isNewToday = !already; // tu flujo debería impedir duplicar, pero por si acaso

      let newDays = 1;
      if (existing?.updatedAt) {
        const lastDay = this.stripTimeUTC(existing.updatedAt);
        const diff = Math.round((day.getTime() - lastDay.getTime()) / 86400000);
        if (diff === 0) {
          // ya contada la racha hoy -> no sumes de nuevo
          newDays = existing.days;
        } else if (diff === 1) {
          newDays = existing.days + 1;
        } else {
          newDays = 1;
        }
      }

      // 2) Upsert de racha
      const streak = await tx.streak.upsert({
        where: { userId },
        update: { days: newDays },
        create: { userId, days: 1 },
      });

      // 3) Puntos (regla simple)
      let pointsAdded = 0;
      const writes: Promise<any>[] = [];

      if (isNewToday) {
        // primer checkin de la vida?
        const firstEver = await tx.checkin.findFirst({ where: { userId } });
        if (!firstEver) {
          pointsAdded += 50;
          writes.push(tx.pointsLedger.create({ data: { userId, delta: 50, reason: 'first_checkin' } }));
        }

        // puntos por checkin diario
        pointsAdded += 10;
        writes.push(tx.pointsLedger.create({ data: { userId, delta: 10, reason: 'daily_checkin' } }));

        // bonus por racha (7 y 30)
        const unlocked: string[] = [];
        if (streak.days >= 7) {
          const has = await tx.userAchievement.findUnique({ where: { userId_achievementId: { userId, achievementId: ACHIEVEMENTS.STREAK_7 } } });
          if (!has) {
            unlocked.push(ACHIEVEMENTS.STREAK_7);
            pointsAdded += 70;
            writes.push(
              tx.userAchievement.create({ data: { userId, achievementId: ACHIEVEMENTS.STREAK_7 } }),
              tx.pointsLedger.create({ data: { userId, delta: 70, reason: 'streak_7' } })
            );
          }
        }
        if (streak.days >= 30) {
          const has = await tx.userAchievement.findUnique({ where: { userId_achievementId: { userId, achievementId: ACHIEVEMENTS.STREAK_30 } } });
          if (!has) {
            unlocked.push(ACHIEVEMENTS.STREAK_30);
            pointsAdded += 150;
            writes.push(
              tx.userAchievement.create({ data: { userId, achievementId: ACHIEVEMENTS.STREAK_30 } }),
              tx.pointsLedger.create({ data: { userId, delta: 150, reason: 'streak_30' } })
            );
          }
        }

        // primer_checkin achievement
        const hasFirst = await tx.userAchievement.findUnique({ where: { userId_achievementId: { userId, achievementId: ACHIEVEMENTS.FIRST_CHECKIN } } });
        if (!hasFirst) {
          writes.push(tx.userAchievement.create({ data: { userId, achievementId: ACHIEVEMENTS.FIRST_CHECKIN } }));
        }
      }

      if (writes.length) await Promise.all(writes);

      // 4) total points y achievements para respuesta
      const [agg, userAch] = await Promise.all([
        tx.pointsLedger.aggregate({ _sum: { delta: true }, where: { userId } }),
        tx.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
      ]);

      const totalPoints = agg._sum.delta ?? 0;

      return {
        streakDays: streak.days,
        pointsAdded,
        unlocked: userAch.map(x => x.achievementId),
      };
    });
  }

  async getMyGamification(userId: string) {
    const [streak, agg, ua] = await Promise.all([
      this.prisma.streak.findUnique({ where: { userId } }),
      this.prisma.pointsLedger.aggregate({ _sum: { delta: true }, where: { userId } }),
      this.prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
    ]);

    return {
      streakDays: streak?.days ?? 0,
      totalPoints: agg._sum.delta ?? 0,
      achievements: ua.map(x => x.achievementId),
    };
  }

  async listMyPoints(userId: string, params: { take: number; cursor?: string }) {
    const { take, cursor } = params;
    const q: any = {
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      select: { id: true, delta: true, reason: true, meta: true, createdAt: true },
    };
    if (cursor) { q.cursor = { id: cursor }; q.skip = 1; }

    const rows = await this.prisma.pointsLedger.findMany(q);
    const hasMore = rows.length > take;
    return { items: rows.slice(0, take), nextCursor: hasMore ? rows[take].id : null };
  }

  private stripTimeUTC(d: Date) {
    const x = new Date(d);
    x.setUTCHours(0, 0, 0, 0);
    return x;
  }
}
