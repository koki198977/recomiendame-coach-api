import { Inject, Injectable } from '@nestjs/common';
import {
  ADMIN_USER_REPOSITORY,
  AdminUserRepositoryPort,
  AdminUserSummary,
} from '../ports/out.admin-user-repository.port';

@Injectable()
export class AdminListUsersUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY)
    private readonly repo: AdminUserRepositoryPort,
  ) {}

  async execute(params: {
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ items: AdminUserSummary[]; total: number }> {
    return this.repo.listUsers(params);
  }
}
