import { Body, Controller, Delete, Get, Param, Post as PostMethod, Query, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePostUseCase } from '../../core/application/posts/use-cases/create-post.usecase';
import { LikePostUseCase } from '../../core/application/posts/use-cases/like-post.usecase';
import { UnlikePostUseCase } from '../../core/application/posts/use-cases/unlike-post.usecase';
import { CreatePostDto } from '../../core/application/posts/dto/create-post.dto';
import { CreateCommentUseCase } from '../../core/application/posts/use-cases/create-comment.usecase';
import { DeleteCommentUseCase } from '../../core/application/posts/use-cases/delete-comment.usecase';
import { ListCommentsUseCase } from '../../core/application/posts/use-cases/list-comments.usecase';
import { CreateCommentDto } from '../../core/application/posts/dto/create-comment.dto';
import { ListCommentsDto } from '../../core/application/posts/dto/list-comments.dto';

@Controller('posts')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class PostsController {
  constructor(
    private readonly createPost: CreatePostUseCase,
    private readonly likePost: LikePostUseCase,
    private readonly unlikePost: UnlikePostUseCase,
    private readonly createComment: CreateCommentUseCase,
    private readonly deleteComment: DeleteCommentUseCase,
    private readonly listComments: ListCommentsUseCase,
  ) {}

  @PostMethod()
  create(@Body() dto: CreatePostDto, @Req() req: any) {
    return this.createPost.execute(req.user.userId, dto);
  }

  @PostMethod(':id/like')
  like(@Param('id') postId: string, @Req() req: any) {
    return this.likePost.execute(req.user.userId, postId);
  }

  @Delete(':id/like')
  unlike(@Param('id') postId: string, @Req() req: any) {
    return this.unlikePost.execute(req.user.userId, postId);
  }

  @PostMethod(':id/comments')
  addComment(@Param('id') postId: string, @Body() dto: CreateCommentDto, @Req() req: any) {
    return this.createComment.execute(req.user.userId, postId, dto);
  }

  @Get(':id/comments')
  listPostComments(@Param('id') postId: string, @Query() q: ListCommentsDto) {
    return this.listComments.execute(postId, q);
  }

  @Delete(':id/comments/:commentId')
  removeComment(@Param('commentId') commentId: string, @Req() req: any) {
    return this.deleteComment.execute(req.user.userId, commentId);
  }
}
