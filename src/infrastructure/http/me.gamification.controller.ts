import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetMyGamificationUseCase } from '../../core/application/gamification/use-cases/get-my-gamification.usecase';
import { ListMyPointsUseCase } from '../../core/application/gamification/use-cases/list-my-points.usecase';

@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeGamificationController {
  constructor(
    private readonly getMine: GetMyGamificationUseCase,
    private readonly listPoints: ListMyPointsUseCase,
  ) {}

  @Get('gamification')
  async gamification(@Req() req: any) {
    return this.getMine.execute(req.user.userId);
  }

  @Get('points')
  async points(@Req() req: any, @Query('take') take = 20, @Query('cursor') cursor?: string) {
    return this.listPoints.execute(req.user.userId, Number(take), cursor);
  }
}
