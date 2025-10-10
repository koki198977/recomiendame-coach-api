import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { GenerateWeeklyPlanUseCase } from '../../core/application/plans/use-cases/generate-weekly-plan.usecase';
import { GetPlanByIdUseCase } from 'src/core/application/plans/use-cases/get-plan-by-id.usecase';
import { GetPlanByWeekUseCase } from 'src/core/application/plans/use-cases/get-plan-by-week.usecase';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('plans')
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(
    private readonly generate: GenerateWeeklyPlanUseCase,
    private readonly getById: GetPlanByIdUseCase,
    private readonly getByWeek: GetPlanByWeekUseCase,
  ) {}

  @Get(':id')
  async byId(@Param('id') id: string) {
    return this.getById.execute(id);
  }

  @Get()
  async byWeek(
    @Query('week') isoWeek: string,
    @Query('userId') userId: string,
  ) {
    return this.getByWeek.execute(userId, isoWeek);
  }

  @Post('generate')
  async generatePlan(@Query('week') isoWeek: string, @Body() body: any, @Req() req: any) {
    const userId = req.user.userId;
    const input = {
      userId,
      isoWeek,
      kcalTarget: body.kcalTarget ?? 2200,
      protein_g: body.protein_g ?? 140,
      carbs_g: body.carbs_g ?? 220,
      fat_g: body.fat_g ?? 70,
    };
    const res = await this.generate.execute(input);
    if (!res.ok) throw res.error;
    return res.value;
  }
}
