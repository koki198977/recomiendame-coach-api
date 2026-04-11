import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ADMIN_USER_REPOSITORY,
  AdminUserRepositoryPort,
} from '../ports/out.admin-user-repository.port';

@Injectable()
export class AdminDeleteUserUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY)
    private readonly repo: AdminUserRepositoryPort,
  ) {}

  async execute(userId: string, requesterId: string): Promise<void> {
    if (userId === requesterId) {
      throw new BadRequestException('No puedes eliminar tu propia cuenta');
    }

    const user = await this.repo.getUserDetail(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    await this.repo.deleteUser(userId);
  }
}
