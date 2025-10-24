import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../ports/out.user-repository.port';

@Injectable()
export class GetUserProfileUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort) {}
  
  async execute(userId: string, viewerId?: string) {
    const profile = await this.users.getUserProfile(userId, viewerId);
    if (!profile) throw new NotFoundException('Usuario no encontrado');
    return profile;
  }
}