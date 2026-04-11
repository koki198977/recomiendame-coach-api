import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ADMIN_USER_REPOSITORY,
  AdminUserRepositoryPort,
  AdminUserDetail,
} from '../ports/out.admin-user-repository.port';

@Injectable()
export class AdminGetUserDetailUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY)
    private readonly repo: AdminUserRepositoryPort,
  ) {}

  async execute(userId: string): Promise<AdminUserDetail> {
    const user = await this.repo.getUserDetail(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
}
