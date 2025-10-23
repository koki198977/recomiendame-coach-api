import { Inject, Injectable } from '@nestjs/common';
import { POST_REPOSITORY, PostRepositoryPort } from '../ports/out.post-repository.port';

@Injectable()
export class GetPublicPostsUseCase {
  constructor(@Inject(POST_REPOSITORY) private readonly repo: PostRepositoryPort) {}

  async execute(userId: string, params: { skip?: number; take?: number }) {
    const skip = params.skip ?? 0;
    const take = Math.min(params.take ?? 20, 100); // Máximo 100 posts
    
    return this.repo.getPublicPosts(userId, { skip, take });
  }
}