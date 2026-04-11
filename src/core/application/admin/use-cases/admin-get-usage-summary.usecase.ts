import { Inject, Injectable } from '@nestjs/common';
import {
  ADMIN_USAGE_REPOSITORY,
  AdminUsageRepositoryPort,
  AdminFeatureSummary,
} from '../ports/out.admin-usage-repository.port';

@Injectable()
export class AdminGetUsageSummaryUseCase {
  constructor(
    @Inject(ADMIN_USAGE_REPOSITORY)
    private readonly repo: AdminUsageRepositoryPort,
  ) {}

  async execute(): Promise<AdminFeatureSummary[]> {
    return this.repo.getUsageSummary();
  }
}
