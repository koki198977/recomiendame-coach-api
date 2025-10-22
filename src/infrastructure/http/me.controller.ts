import { Body, Controller, Delete, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetMyStatsUseCase } from '../../core/application/stats/use-cases/get-my-stats.usecase';
import { DeleteUserUseCase } from '../../core/application/users/use-cases/delete-user.usecase';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(
    private readonly statsUC: GetMyStatsUseCase,
    private readonly deleteUserUC: DeleteUserUseCase,
  ) {}

  @Get('stats')
  stats(@Req() req: any) {
    return this.statsUC.execute(req.user.userId);
  }

  @Delete('account')
  async deleteAccount(@Req() req: any, @Body() dto?: { confirmation?: string }) {
    return this.deleteUserUC.execute(req.user.userId, dto?.confirmation);
  }
}
