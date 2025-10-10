export interface CreatePostResult {
  id: string;
  createdAt: Date;
}

export interface PostRepositoryPort {
  create(input: { authorId: string; caption?: string; challengeId?: string | null; mediaUrl?: string | null }): Promise<CreatePostResult>;
  like(input: { userId: string; postId: string }): Promise<void>;
  unlike(input: { userId: string; postId: string }): Promise<void>;
  hasLike(input: { userId: string; postId: string }): Promise<boolean>;
}
export const POST_REPOSITORY = Symbol('POST_REPOSITORY');
