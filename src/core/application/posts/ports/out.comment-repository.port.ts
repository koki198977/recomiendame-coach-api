export interface CommentListItem {
  id: string;
  body: string;
  createdAt: Date;
  author: { id: string; email: string };
}

export interface CommentRepositoryPort {
  create(input: { postId: string; authorId: string; body: string }): Promise<{ id: string; createdAt: Date }>;
  delete(input: { commentId: string; authorId: string }): Promise<void>; // solo autor puede borrar
  list(input: { postId: string; skip: number; take: number }): Promise<{ items: CommentListItem[]; total: number }>;
}
export const COMMENT_REPOSITORY = Symbol('COMMENT_REPOSITORY');
