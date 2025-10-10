import { Module } from '@nestjs/common';
import { MeFeedController } from '../infrastructure/http/me.feed.controller';
import { GetMyFeedUseCase } from '../core/application/feed/use-cases/get-my-feed.usecase';
import { FEED_REPOSITORY } from '../core/application/feed/ports/out.feed-repository.port';
import { FeedPrismaRepository } from '../infrastructure/persistence/prisma/feed.prisma.repository';

@Module({
  controllers: [MeFeedController],
  providers: [
    GetMyFeedUseCase,
    { provide: FEED_REPOSITORY, useClass: FeedPrismaRepository },
  ],
})
export class MeFeedModule {}
