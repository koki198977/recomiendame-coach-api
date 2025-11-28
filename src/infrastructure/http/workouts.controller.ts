import { Body, Controller, Get, Post, Query, UseGuards, Request, Delete, Put, Param } from '@nestjs/common';
import { GenerateWeeklyWorkoutPlanUseCase } from '../../core/application/workouts/use-cases/generate-weekly-workout-plan.usecase';
import { GetWorkoutPlanUseCase } from '../../core/application/workouts/use-cases/get-workout-plan.usecase';
import { DeleteWorkoutPlanUseCase } from '../../core/application/workouts/use-cases/delete-workout-plan.usecase';
import { UpdateWorkoutPlanUseCase } from '../../core/application/workouts/use-cases/update-workout-plan.usecase';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('workouts')
@UseGuards(JwtAuthGuard)
export class WorkoutsController {
  constructor(
    private readonly generateWeeklyPlan: GenerateWeeklyWorkoutPlanUseCase,
    private readonly getWorkoutPlan: GetWorkoutPlanUseCase,
    private readonly deleteWorkoutPlan: DeleteWorkoutPlanUseCase,
    private readonly updateWorkoutPlan: UpdateWorkoutPlanUseCase,
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

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    const result = await this.deleteWorkoutPlan.execute({ userId, planId: id });
    if (result.ok) {
      return result.value;
    } else {
      throw result.error;
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    const result = await this.updateWorkoutPlan.execute({
      userId,
      planId: id,
      notes: body.notes,
    });
    if (result.ok) {
      return result.value;
    } else {
      throw result.error;
    }
  }
}
