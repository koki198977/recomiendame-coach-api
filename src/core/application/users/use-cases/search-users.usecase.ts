import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../ports/out.user-repository.port';

@Injectable()
export class SearchUsersUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort) {}

  async execute(query: string, params: { skip?: number; take?: number }, viewerId?: string) {
    const skip = params.skip ?? 0;
    const take = Math.min(params.take ?? 20, 100); // Máximo 100 usuarios
    
    if (!query || query.trim().length < 2) {
      return { items: [], total: 0 };
    }

    return this.userRepo.searchUsers(query.trim(), { skip, take }, viewerId);
  }
}