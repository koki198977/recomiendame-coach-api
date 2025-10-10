import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../ports/out.user-repository.port';

@Injectable()
export class GetUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort) {}
  async execute(id: string) {
    const u = await this.users.findById(id);
    if (!u) throw new NotFoundException('Usuario no encontrado');
    return { id: u.id, email: u.email };
  }
}
