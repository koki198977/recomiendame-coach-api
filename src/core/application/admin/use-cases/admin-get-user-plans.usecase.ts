import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  AdminUserRepositoryPort,
  ADMIN_USER_REPOSITORY,
} from '../ports/out.admin-user-repository.port';

@Injectable()
export class AdminGetUserPlansUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY)
    private readonly repo: AdminUserRepositoryPort,
  ) {}

  async execute(userId: string) {
    const detail = await this.repo.getUserDetail(userId);
    if (!detail) throw new NotFoundException(`User ${userId} not found`);
    return this.repo.getUserPlans(userId);
  }
}
