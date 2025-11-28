import { Body, Controller, Get, Inject, Param, Post, Query, Req, StreamableFile, UseGuards } from '@nestjs/common';
import { GenerateWeeklyPlanUseCase } from '../../core/application/plans/use-cases/generate-weekly-plan.usecase';
import { GetPlanByIdUseCase } from 'src/core/application/plans/use-cases/get-plan-by-id.usecase';
import { GetPlanByWeekUseCase } from 'src/core/application/plans/use-cases/get-plan-by-week.usecase';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RegeneratePlanDayUseCase } from 'src/core/application/plans/use-cases/regenerate-plan-day.usecase';
import { SwapMealUseCase } from 'src/core/application/plans/use-cases/swap-meal.usecase';
import { GetShoppingListUseCase } from 'src/core/application/plans/use-cases/get-shopping-list.usecase';
import { GenerateShoppingListUseCase } from 'src/core/application/plans/use-cases/generate-shopping-list.usecase';
import { MacrosService } from 'src/core/application/plans/services/macros.service';
import { PROFILE_REPO, ProfileRepoPort } from 'src/core/application/profile/ports/out.profile-repo.port';
import { DeleteMealPlanUseCase } from 'src/core/application/plans/use-cases/delete-meal-plan.usecase';
import { Delete, HttpCode, HttpStatus } from '@nestjs/common';

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
    private readonly shoppingListUC: GenerateShoppingListUseCase,
    private readonly macros: MacrosService,
    private readonly deleteMealPlan: DeleteMealPlanUseCase,
    @Inject(PROFILE_REPO) private readonly profiles: ProfileRepoPort,
  ) {}

  @Get(':id')
  async byId(@Param('id') id: string) {
    return this.getById.execute(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    await this.deleteMealPlan.execute(id, userId);
  }

  @Get()
  async byWeek(@Query('week') isoWeek: string, @Req() req: any) {
    const userId = req.user.userId ?? req.user.sub; // 👈 del token
    return this.getByWeek.execute(userId, isoWeek);
  }

  @Post('generate')
  async generatePlan(@Query('week') isoWeek: string, @Body() body: any, @Req() req: any) {
    const userId = req.user.userId ?? req.user.sub;

    let kcalTarget = body.kcalTarget;
    let protein_g = body.protein_g;
    let carbs_g = body.carbs_g;
    let fat_g = body.fat_g;

    if ([kcalTarget, protein_g, carbs_g, fat_g].some(v => v == null)) {
      // calcular
      const prof = await this.profiles.get(userId);
      const calc = this.macros.compute({
        sex: prof.sex, birthDate: prof.birthDate, heightCm: prof.heightCm, weightKg: Number(prof.weightKg),
        activityLevel: prof.activityLevel
      }, prof.goal ? { type: prof.goal.goalType } : undefined as any);
      ({ kcalTarget, protein_g, carbs_g, fat_g } = calc.macros);
    }

    const input = { userId, isoWeek, kcalTarget, protein_g, carbs_g, fat_g };
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
  async shoppingList(
    @Param('planId') planId: string,
    @Query('take') takeStr?: string,
    @Query('cursor') cursor?: string,
  ) {
    const take = takeStr ? Number(takeStr) : undefined;
    return this.shoppingListUC.execute(planId, { take, cursor });
  }

  @Get(':planId/shopping-list.csv')
  async shoppingListCSV(@Param('planId') planId: string): Promise<StreamableFile> {
    // exporta TODO en un solo CSV
    const { items } = await this.shoppingListUC.execute(planId, { take: 50000 });
    const csv = this.shoppingListUC.toCSV(items);
    const buf = Buffer.from(csv, 'utf8');

    return new StreamableFile(buf, {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="shopping-list-${planId}.csv"`,
    });
  }
}
