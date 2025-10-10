export interface FeedItem {
  id: string;
  caption?: string | null;
  createdAt: Date;
  visibility: 'PRIVATE' | 'FOLLOWERS' | 'PUBLIC';
  author: { id: string; email: string };
  challenge?: { id: string; title: string } | null;
  media?: { id: string; url: string; width?: number | null; height?: number | null } | null;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
}

export interface FeedRepositoryPort {
  getFeedForUser(userId: string, params: { skip: number; take: number }): Promise<{ items: FeedItem[]; total: number }>;
}
export const FEED_REPOSITORY = Symbol('FEED_REPOSITORY');
