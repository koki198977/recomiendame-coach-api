import { Body, Controller, Get, Post, Query, UseGuards, Request, Delete, Put, Param, ValidationPipe } from '@nestjs/common';
import { GenerateWeeklyWorkoutPlanUseCase } from '../../core/application/workouts/use-cases/generate-weekly-workout-plan.usecase';
import { GetWorkoutPlanUseCase } from '../../core/application/workouts/use-cases/get-workout-plan.usecase';
import { DeleteWorkoutPlanUseCase } from '../../core/application/workouts/use-cases/delete-workout-plan.usecase';
import { UpdateWorkoutPlanUseCase } from '../../core/application/workouts/use-cases/update-workout-plan.usecase';
import { CompleteWorkoutUseCase } from '../../core/application/workouts/use-cases/complete-workout.usecase';
import { GetActivityStatsUseCase } from '../../core/application/workouts/use-cases/get-activity-stats.usecase';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GenerateWorkoutDto } from '../../core/application/workouts/dto/generate-workout.dto';
import { CompleteWorkoutDto } from '../../core/application/workouts/dto/complete-workout.dto';

@Controller('workouts')
@UseGuards(JwtAuthGuard)
export class WorkoutsController {
  constructor(
    private readonly generateWeeklyPlan: GenerateWeeklyWorkoutPlanUseCase,
    private readonly getWorkoutPlan: GetWorkoutPlanUseCase,
    private readonly deleteWorkoutPlan: DeleteWorkoutPlanUseCase,
    private readonly updateWorkoutPlan: UpdateWorkoutPlanUseCase,
    private readonly completeWorkout: CompleteWorkoutUseCase,
    private readonly getActivityStats: GetActivityStatsUseCase,
  ) {}

  @Post('generate')
  async generate(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) body: GenerateWorkoutDto,
    @Request() req: any
  ) {
    const userId = req.user.userId ?? req.user.sub;

    const result = await this.generateWeeklyPlan.execute({
      userId,
      isoWeek: body.isoWeek,
      daysAvailable: body.daysAvailable ?? 4,
      goal: body.goal ?? 'GENERAL',
      equipmentImageUrls: body.equipmentImageUrls,
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

  @Post('completion')
  async complete(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) body: CompleteWorkoutDto,
    @Request() req: any
  ) {
    const userId = req.user.userId ?? req.user.sub;
    const result = await this.completeWorkout.execute(userId, body);
    
    if (result.ok) {
      return result.value;
    } else {
      throw result.error;
    }
  }

  @Get('activity-stats')
  async getActivityStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any
  ) {
    const userId = req.user.userId ?? req.user.sub;
    return await this.getActivityStats.execute(
      userId,
      new Date(startDate),
      new Date(endDate)
    );
  }
}
