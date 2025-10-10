import { Module } from '@nestjs/common';
import { PostsController } from '../infrastructure/http/posts.controller';
import { CreatePostUseCase } from '../core/application/posts/use-cases/create-post.usecase';
import { LikePostUseCase } from '../core/application/posts/use-cases/like-post.usecase';
import { UnlikePostUseCase } from '../core/application/posts/use-cases/unlike-post.usecase';
import { POST_REPOSITORY } from '../core/application/posts/ports/out.post-repository.port';
import { PostPrismaRepository } from '../infrastructure/persistence/prisma/post.prisma.repository';
import { CreateCommentUseCase } from '../core/application/posts/use-cases/create-comment.usecase';
import { DeleteCommentUseCase } from '../core/application/posts/use-cases/delete-comment.usecase';
import { ListCommentsUseCase } from '../core/application/posts/use-cases/list-comments.usecase';
import { COMMENT_REPOSITORY } from '../core/application/posts/ports/out.comment-repository.port';
import { CommentPrismaRepository } from '../infrastructure/persistence/prisma/comment.prisma.repository';

@Module({
  controllers: [PostsController],
  providers: [
    CreatePostUseCase,
    LikePostUseCase,
    UnlikePostUseCase,
    { provide: POST_REPOSITORY, useClass: PostPrismaRepository },
    CreateCommentUseCase,
    DeleteCommentUseCase,
    ListCommentsUseCase,
    { provide: COMMENT_REPOSITORY, useClass: CommentPrismaRepository },
  ],
})
export class PostsModule {}
