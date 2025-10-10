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

        let newDays = 1;
        if (existing?.updatedAt) {
        const lastDay = this.stripTimeUTC(existing.updatedAt);
        const diff = Math.round((day.getTime() - lastDay.getTime()) / 86400000);
        if (diff === 0) newDays = existing.days;        // ya contamos hoy
        else if (diff === 1) newDays = existing.days + 1;
        else newDays = 1;
        }

        // 2) Upsert de racha (esto moverá updatedAt)
        const streak = await tx.streak.upsert({
        where: { userId },
        update: { days: newDays },
        create: { userId, days: 1 },
        });

        // 3) Puntos y logros con “gates” robustos
        let pointsAdded = 0;
        const unlockedCodes: string[] = [];
        const writes: Promise<any>[] = [];

        // 3.1 Daily: gatea por ledger para NO duplicar
        const dailyAlready = await tx.pointsLedger.findFirst({
        where: {
            userId,
            reason: 'daily_checkin',
            // createdAt del día UTC (banda ancha: >= day y < day+1)
            createdAt: { gte: day, lt: new Date(day.getTime() + 86400000) },
        },
        select: { id: true },
        });

        if (!dailyAlready) {
        pointsAdded += 10;
        writes.push(tx.pointsLedger.create({ data: { userId, delta: 10, reason: 'daily_checkin', meta: { day: day.toISOString().slice(0,10) } } }));
        }

        // Helpers para resolver logro por code
        const getAchIdByCode = async (code: string) => {
        const ach = await tx.achievement.findUnique({ where: { code } });
        return ach?.id ?? null;
        };
        const hasAchievement = async (achId: string) => {
        const ua = await tx.userAchievement.findUnique({ where: { userId_achievementId: { userId, achievementId: achId } } });
        return !!ua;
        };

        // 3.2 FIRST_CHECKIN (usa logro como fuente de verdad, no buscar “primer checkin”)
        {
        const achId = await getAchIdByCode(ACHIEVEMENTS.FIRST_CHECKIN);
        if (achId && !(await hasAchievement(achId))) {
            unlockedCodes.push(ACHIEVEMENTS.FIRST_CHECKIN);
            writes.push(tx.userAchievement.create({ data: { userId, achievementId: achId } }));
            // bonus por primer check-in (si quieres)
            pointsAdded += 50;
            writes.push(tx.pointsLedger.create({ data: { userId, delta: 50, reason: 'first_checkin' } }));
        }
        }

        // 3.3 STREAK_7 / STREAK_30
        if (streak.days >= 7) {
        const achId = await getAchIdByCode(ACHIEVEMENTS.STREAK_7);
        if (achId && !(await hasAchievement(achId))) {
            unlockedCodes.push(ACHIEVEMENTS.STREAK_7);
            writes.push(tx.userAchievement.create({ data: { userId, achievementId: achId } }));
            pointsAdded += 70;
            writes.push(tx.pointsLedger.create({ data: { userId, delta: 70, reason: 'streak_7', meta: { days: streak.days } } }));
        }
        }
        if (streak.days >= 30) {
        const achId = await getAchIdByCode(ACHIEVEMENTS.STREAK_30);
        if (achId && !(await hasAchievement(achId))) {
            unlockedCodes.push(ACHIEVEMENTS.STREAK_30);
            writes.push(tx.userAchievement.create({ data: { userId, achievementId: achId } }));
            pointsAdded += 150;
            writes.push(tx.pointsLedger.create({ data: { userId, delta: 150, reason: 'streak_30', meta: { days: streak.days } } }));
        }
        }

        if (writes.length) await Promise.all(writes);

        // 4) Total points + achievements (solo para respuesta)
        const [agg] = await Promise.all([
        tx.pointsLedger.aggregate({ _sum: { delta: true }, where: { userId } }),
        ]);

        const totalPoints = agg._sum.delta ?? 0;

        return {
        streakDays: streak.days,
        pointsAdded,
        unlocked: unlockedCodes, // ← SOLO los recién desbloqueados y en CÓDIGOS
        totalPoints,             // útil para que el front ya actualice marcador
        };
    });
    }


  async getMyGamification(userId: string) {
    const [streak, agg, ua] = await Promise.all([
      this.prisma.streak.findUnique({ where: { userId } }),
      this.prisma.pointsLedger.aggregate({ _sum: { delta: true }, where: { userId } }),
      this.prisma.userAchievement.findMany({ 
        where: { userId }, 
        select: { achievement: { select: { code: true } } }
      }),
    ]);

    return {
      streakDays: streak?.days ?? 0,
      totalPoints: agg._sum.delta ?? 0,
      achievements: ua.map(x => x.achievement.code),
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
