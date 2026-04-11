import { Injectable, Inject } from '@nestjs/common';
import {
  AdminStatsRepositoryPort,
  ADMIN_STATS_REPOSITORY,
} from '../ports/out.admin-stats-repository.port';

@Injectable()
export class AdminGetStatsUseCase {
  constructor(
    @Inject(ADMIN_STATS_REPOSITORY)
    private readonly repo: AdminStatsRepositoryPort,
  ) {}

  async executePreferences() {
    const [allergies, conditions, cuisines, goals, activityLevels] = await Promise.all([
      this.repo.getAllergyStats(),
      this.repo.getConditionStats(),
      this.repo.getCuisineStats(),
      this.repo.getGoalStats(),
      this.repo.getActivityLevelStats(),
    ]);
    return { allergies, conditions, cuisines, goals, activityLevels };
  }

  async executeExtendedMetrics() {
    return this.repo.getExtendedMetrics();
  }

  async executeUserExtra(userId: string) {
    return this.repo.getUserDetailExtra(userId);
  }
}
