import { Inject, Injectable } from '@nestjs/common';
import {
  ADMIN_USAGE_REPOSITORY,
  AdminUsageRepositoryPort,
  AdminMetrics,
} from '../ports/out.admin-usage-repository.port';

@Injectable()
export class AdminGetMetricsUseCase {
  constructor(
    @Inject(ADMIN_USAGE_REPOSITORY)
    private readonly repo: AdminUsageRepositoryPort,
  ) {}

  async execute(): Promise<AdminMetrics> {
    return this.repo.getMetrics();
  }
}
