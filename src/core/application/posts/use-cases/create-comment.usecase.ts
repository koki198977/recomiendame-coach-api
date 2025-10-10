import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { COMMENT_REPOSITORY, CommentRepositoryPort } from '../ports/out.comment-repository.port';
import { CreateCommentDto } from '../dto/create-comment.dto';

@Injectable()
export class CreateCommentUseCase {
  constructor(@Inject(COMMENT_REPOSITORY) private readonly comments: CommentRepositoryPort) {}
  async execute(userId: string, postId: string, dto: CreateCommentDto) {
    const r = await this.comments.create({ postId, authorId: userId, body: dto.body });
    return { id: r.id, createdAt: r.createdAt };
  }
}
