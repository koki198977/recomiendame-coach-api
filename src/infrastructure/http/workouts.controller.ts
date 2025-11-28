import { Body, Controller, Get, Post, Query, UseGuards, Request } from '@nestjs/common';
import { GenerateWeeklyWorkoutPlanUseCase } from '../../core/application/workouts/use-cases/generate-weekly-workout-plan.usecase';
import { GetWorkoutPlanUseCase } from '../../core/application/workouts/use-cases/get-workout-plan.usecase';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('workouts')
@UseGuards(JwtAuthGuard)
export class WorkoutsController {
  constructor(
    private readonly generateWeeklyPlan: GenerateWeeklyWorkoutPlanUseCase,
    private readonly getWorkoutPlan: GetWorkoutPlanUseCase,
  ) {}

  @Post('generate')
  async generate(@Body() body: any, @Request() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    const { isoWeek, daysAvailable, goal } = body;

    const result = await this.generateWeeklyPlan.execute({
      userId,
      isoWeek,
      daysAvailable: daysAvailable ?? 4,
      goal: goal ?? 'GENERAL',
    });

    if (result.ok) {
      return result.value;
    } else {
      throw result.error;
    }
  }

  @Get()
  async get(@Query('isoWeek') isoWeek: string, @Request() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    return this.getWorkoutPlan.execute(userId, isoWeek);
  }
}
