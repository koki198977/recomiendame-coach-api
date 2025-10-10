import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FEED_REPOSITORY, FeedItem, FeedRepositoryPort } from '../../../core/application/feed/ports/out.feed-repository.port';

@Injectable()
export class FeedPrismaRepository implements FeedRepositoryPort {
  constructor(private prisma: PrismaService) {}

  async getFeedForUser(userId: string, params: { skip: number; take: number }) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId }, select: { followingId: true },
    });
    const followingIds = following.map(f => f.followingId);

    const memberships = await this.prisma.challengeMembership.findMany({
      where: { userId }, select: { challengeId: true },
    });
    const memberChallengeIds = memberships.map(m => m.challengeId);

    const where = {
      OR: [
        { AND: [{ authorId: { in: [...followingIds, userId] } }, { visibility: { in: ['PUBLIC', 'FOLLOWERS'] as any } }] },
        { AND: [{ challengeId: { in: memberChallengeIds }, NOT: { challengeId: null } }, { visibility: { in: ['PUBLIC', 'FOLLOWERS'] as any } }] },
      ],
    };

    const posts = await this.prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, email: true } },
        challenge: { select: { id: true, title: true } },
        media: { select: { id: true, url: true, width: true, height: true } },
        _count: { select: { likes: true, comments: true } },                
        likes: { where: { userId }, select: { userId: true } },            
      },
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take,
    });

    const total = await this.prisma.post.count({ where });

    const items: FeedItem[] = posts.map(p => ({
      id: p.id,
      caption: p.caption,
      createdAt: p.createdAt,
      visibility: p.visibility as any,
      author: { id: p.author.id, email: p.author.email },
      challenge: p.challenge ? { id: p.challenge.id, title: p.challenge.title } : null,
      media: p.media ? { id: p.media.id, url: p.media.url, width: p.media.width ?? null, height: p.media.height ?? null } : null,
      likesCount: p._count.likes,                     
      commentsCount: p._count.comments,              
      likedByMe: (p.likes?.length ?? 0) > 0,
    }));

    return { items, total };
  }
}
