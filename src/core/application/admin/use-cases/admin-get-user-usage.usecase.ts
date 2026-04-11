import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ADMIN_USAGE_REPOSITORY,
  AdminUsageRepositoryPort,
  AdminUserUsage,
} from '../ports/out.admin-usage-repository.port';
import {
  ADMIN_USER_REPOSITORY,
  AdminUserRepositoryPort,
} from '../ports/out.admin-user-repository.port';

@Injectable()
export class AdminGetUserUsageUseCase {
  constructor(
    @Inject(ADMIN_USAGE_REPOSITORY)
    private readonly usageRepo: AdminUsageRepositoryPort,
    @Inject(ADMIN_USER_REPOSITORY)
    private readonly userRepo: AdminUserRepositoryPort,
  ) {}

  async execute(userId: string): Promise<AdminUserUsage[]> {
    const user = await this.userRepo.getUserDetail(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.usageRepo.getUserUsage(userId);
  }
}
