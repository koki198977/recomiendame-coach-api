import { Inject, Injectable } from '@nestjs/common';
import { CHECKIN_REPOSITORY, CheckinRepositoryPort } from '../ports/out.checkin-repository.port';
import { UpsertCheckinDto } from '../dto/upsert-checkin.dto';
import { STREAK_REPOSITORY, StreakRepositoryPort } from '../../stats/ports/out.streak-repository.port';
import { POINTS_LEDGER_PORT, PointsLedgerPort } from '../../stats/ports/out.points-ledger.port';
import { ACHIEVEMENT_PORT, AchievementPort } from '../../achievements/ports/out.achievement.port';

const ACH = {
  FIRST_CHECKIN: 'first_checkin',
  STREAK_7: 'streak_7',
  STREAK_30: 'streak_30',
};

function normalizeUTC(date: Date) {
  return new Date(date.toISOString().slice(0, 10) + 'T00:00:00.000Z');
}
function addDays(d: Date, n: number) {
  const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x;
}

@Injectable()
export class UpsertCheckinUseCase {
  constructor(
    @Inject(CHECKIN_REPOSITORY) private readonly repo: CheckinRepositoryPort,
    @Inject(STREAK_REPOSITORY) private readonly streaks: StreakRepositoryPort,
    @Inject(POINTS_LEDGER_PORT) private readonly points: PointsLedgerPort,
    @Inject(ACHIEVEMENT_PORT) private readonly achievements: AchievementPort,
  ) {}

  async execute(userId: string, dto: UpsertCheckinDto) {
    const date = dto.date
      ? new Date(dto.date + 'T00:00:00.000Z')
      : normalizeUTC(new Date());

    // 1) upsert checkin
    const saved = await this.repo.upsertForDate({
      userId, date,
      weightKg: dto.weightKg ?? null,
      adherencePct: dto.adherencePct ?? null,
      hungerLvl: dto.hungerLvl ?? null,
      notes: dto.notes ?? null,
    });

    // 2) streak: +1 si es consecutivo, reset si se “rompió”
    const today = normalizeUTC(date);
    const yesterday = addDays(today, -1);

    const prevDays = await this.streaks.getDays(userId);
    let newDays = 1;

    // Heurística: si ya había streak y hoy no es ayer+1 → empezamos de 1
    // Para mayor exactitud, podríamos mirar si existe check-in en `yesterday` desde repo.
    if (prevDays > 0) {
      // Si el usuario ya venía con streak, asumimos consecutivo si HOY == AYER+1
      // (Puedes mejorar esto consultando check-in de ayer explícitamente.)
      const nowUTC = normalizeUTC(new Date());
      if (today.getTime() === nowUTC.getTime() || today.getTime() === normalizeUTC(addDays(nowUTC, 0)).getTime()) {
        newDays = prevDays + 1;
      } else if (today.getTime() === normalizeUTC(addDays(nowUTC, -1)).getTime()) {
        // Permitimos carga atrasada de AYER
        newDays = prevDays + 1;
      } else {
        newDays = 1;
      }
    }
    await this.streaks.setDays(userId, newDays);

    // 3) points: sumar por check-in (p.ej. 10 puntos)
    await this.points.add(userId, 10, 'checkin', { date: today.toISOString().slice(0, 10) });

    // 4) achievements
    // 4.1 primer check-in
    if (!(await this.achievements.has(userId, ACH.FIRST_CHECKIN))) {
      await this.achievements.unlock(userId, ACH.FIRST_CHECKIN);
      await this.points.add(userId, 20, 'achievement', { code: ACH.FIRST_CHECKIN });
    }
    // 4.2 streaks
    if (newDays >= 7 && !(await this.achievements.has(userId, ACH.STREAK_7))) {
      await this.achievements.unlock(userId, ACH.STREAK_7);
      await this.points.add(userId, 50, 'achievement', { code: ACH.STREAK_7, days: newDays });
    }
    if (newDays >= 30 && !(await this.achievements.has(userId, ACH.STREAK_30))) {
      await this.achievements.unlock(userId, ACH.STREAK_30);
      await this.points.add(userId, 150, 'achievement', { code: ACH.STREAK_30, days: newDays });
    }

    return { ok: true, id: saved.props.id, date: saved.props.date, streakDays: newDays };
  }
}
