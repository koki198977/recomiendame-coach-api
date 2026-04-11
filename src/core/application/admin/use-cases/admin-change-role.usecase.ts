import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ADMIN_USER_REPOSITORY,
  AdminUserRepositoryPort,
  AdminUserSummary,
} from '../ports/out.admin-user-repository.port';

@Injectable()
export class AdminChangeRoleUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY)
    private readonly repo: AdminUserRepositoryPort,
  ) {}

  async execute(
    userId: string,
    role: 'USER' | 'ADMIN',
  ): Promise<AdminUserSummary> {
    const user = await this.repo.getUserDetail(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    return this.repo.changeRole(userId, role);
  }
}
