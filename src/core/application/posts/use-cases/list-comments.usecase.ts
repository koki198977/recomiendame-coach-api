import { Inject, Injectable } from '@nestjs/common';
import { COMMENT_REPOSITORY, CommentRepositoryPort } from '../ports/out.comment-repository.port';
import { ListCommentsDto } from '../dto/list-comments.dto';

@Injectable()
export class ListCommentsUseCase {
  constructor(@Inject(COMMENT_REPOSITORY) private readonly comments: CommentRepositoryPort) {}
  execute(postId: string, q: ListCommentsDto) {
    return this.comments.list({ postId, skip: q.skip, take: q.take });
  }
}
