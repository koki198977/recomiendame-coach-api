import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../ports/out.user-repository.port';

@Injectable()
export class GetUserFollowersUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort) {}

  async execute(userId: string, params: { skip?: number; take?: number }) {
    const skip = params.skip ?? 0;
    const take = Math.min(params.take ?? 20, 100); // Máximo 100 seguidores
    
    return this.userRepo.getUserFollowers(userId, { skip, take });
  }
}