import { Controller, Get, Query, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetMyFeedUseCase } from '../../core/application/feed/use-cases/get-my-feed.usecase';
import { GetFeedDto } from '../../core/application/feed/dto/get-feed.dto';

@Controller('me')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class MeFeedController {
  constructor(private readonly feedUC: GetMyFeedUseCase) {}

  @Get('feed')
  getFeed(@Query() q: GetFeedDto, @Req() req: any) {
    return this.feedUC.execute(req.user.userId, q);
  }
}
