import { Inject, Injectable } from '@nestjs/common';
import { STREAK_REPOSITORY, StreakRepositoryPort } from '../ports/out.streak-repository.port';
import { POINTS_LEDGER_PORT, PointsLedgerPort } from '../ports/out.points-ledger.port';
import { ACHIEVEMENT_PORT, AchievementPort } from '../../achievements/ports/out.achievement.port';

@Injectable()
export class GetMyStatsUseCase {
  constructor(
    @Inject(STREAK_REPOSITORY) private readonly streaks: StreakRepositoryPort,
    @Inject(POINTS_LEDGER_PORT) private readonly points: PointsLedgerPort,
    @Inject(ACHIEVEMENT_PORT) private readonly achievements: AchievementPort,
  ) {}

  async execute(userId: string) {
    const [streakDays, totalPoints, unlocked] = await Promise.all([
      this.streaks.getDays(userId),
      this.points.sum(userId),
      this.achievements.listUnlockedCodes(userId),
    ]);

    return {
      streakDays,
      totalPoints,
      achievements: unlocked,
    };
  }
}
