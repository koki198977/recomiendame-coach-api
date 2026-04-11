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

  executeExtendedMetrics() { return this.repo.getExtendedMetrics(); }
  executeUserExtra(userId: string) { return this.repo.getUserDetailExtra(userId); }
  executeRetention() { return this.repo.getRetentionStats(); }
  executeChapi() { return this.repo.getChapiStats(); }
  executeFitness() { return this.repo.getFitnessStats(); }
  executeNutrition() { return this.repo.getNutritionStats(); }
  executeWellness() { return this.repo.getWellnessStats(); }
  executeSocial() { return this.repo.getSocialStats(); }
  executeGamification() { return this.repo.getGamificationStats(); }
  executeOps() { return this.repo.getOpsStats(); }
}
