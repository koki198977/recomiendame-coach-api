import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { GenerateWeeklyPlanUseCase } from '../../core/application/plans/use-cases/generate-weekly-plan.usecase';
import { GetPlanByIdUseCase } from 'src/core/application/plans/use-cases/get-plan-by-id.usecase';
import { GetPlanByWeekUseCase } from 'src/core/application/plans/use-cases/get-plan-by-week.usecase';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RegeneratePlanDayUseCase } from 'src/core/application/plans/use-cases/regenerate-plan-day.usecase';
import { SwapMealUseCase } from 'src/core/application/plans/use-cases/swap-meal.usecase';
import { GetShoppingListUseCase } from 'src/src/core/application/plans/use-cases/get-shopping-list.usecase';

@Controller('plans')
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(
    private readonly generate: GenerateWeeklyPlanUseCase,
    private readonly getById: GetPlanByIdUseCase,
    private readonly getByWeek: GetPlanByWeekUseCase,
    private readonly regenerateDay: RegeneratePlanDayUseCase,
    private readonly swapMeal: SwapMealUseCase,
    private readonly getShopping: GetShoppingListUseCase,
  ) {}

  @Get(':id')
  async byId(@Param('id') id: string) {
    return this.getById.execute(id);
  }

  @Get()
  async byWeek(@Query('week') isoWeek: string, @Req() req: any) {
    const userId = req.user.userId ?? req.user.sub; // 👈 del token
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

  @Post(':planId/days/:dayIndex/regenerate')
  async regenerate(
    @Param('planId') planId: string,
    @Param('dayIndex') dayIndexStr: string,
    @Req() req: any,
  ) {
    const dayIndex = Number(dayIndexStr);
    const userId = req.user.userId;
    return this.regenerateDay.execute({ planId, dayIndex, userId });
  }

  @Post(':planId/days/:dayIndex/meals/:mealIndex/swap')
  async swap(
    @Param('planId') planId: string,
    @Param('dayIndex') dayIndexStr: string,
    @Param('mealIndex') mealIndexStr: string,
    @Req() req: any,
  ) {
    const dayIndex = Number(dayIndexStr);
    const mealIndex = Number(mealIndexStr);
    const userId = req.user.userId;
    return this.swapMeal.execute({ planId, dayIndex, mealIndex, userId });
  }

  @Get(':planId/shopping-list')
  async shopping(@Param('planId') planId: string, @Req() req: any) {
    return this.getShopping.execute(planId);
  }
}
