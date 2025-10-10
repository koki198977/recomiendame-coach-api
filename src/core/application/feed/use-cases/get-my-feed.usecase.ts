import { Inject, Injectable } from '@nestjs/common';
import { FEED_REPOSITORY, FeedRepositoryPort } from '../ports/out.feed-repository.port';
import { GetFeedDto } from '../dto/get-feed.dto';

@Injectable()
export class GetMyFeedUseCase {
  constructor(@Inject(FEED_REPOSITORY) private readonly repo: FeedRepositoryPort) {}

  execute(userId: string, dto: GetFeedDto) {
    return this.repo.getFeedForUser(userId, { skip: dto.skip, take: dto.take });
  }
}
