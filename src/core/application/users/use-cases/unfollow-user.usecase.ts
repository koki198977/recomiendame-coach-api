import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../ports/out.user-repository.port';

@Injectable()
export class UnfollowUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort) {}

  async execute(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('No puedes dejar de seguirte a ti mismo');
    }

    // Verificar si realmente lo sigue
    const isFollowing = await this.userRepo.isFollowing(followerId, followingId);
    if (!isFollowing) {
      throw new BadRequestException('No sigues a este usuario');
    }

    await this.userRepo.unfollowUser(followerId, followingId);
    
    return { success: true, message: 'Dejaste de seguir al usuario' };
  }
}