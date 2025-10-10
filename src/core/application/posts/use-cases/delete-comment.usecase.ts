import { Inject, Injectable } from '@nestjs/common';
import { COMMENT_REPOSITORY, CommentRepositoryPort } from '../ports/out.comment-repository.port';

@Injectable()
export class DeleteCommentUseCase {
  constructor(@Inject(COMMENT_REPOSITORY) private readonly comments: CommentRepositoryPort) {}
  execute(userId: string, commentId: string) {
    return this.comments.delete({ commentId, authorId: userId });
  }
}
