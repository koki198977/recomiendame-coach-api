import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetMyStatsUseCase } from '../../core/application/stats/use-cases/get-my-stats.usecase';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly statsUC: GetMyStatsUseCase) {}

  @Get('stats')
  stats(@Req() req: any) {
    return this.statsUC.execute(req.user.userId);
  }
}
