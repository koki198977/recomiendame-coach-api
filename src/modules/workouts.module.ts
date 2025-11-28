import { Module } from '@nestjs/common';
import { WorkoutsController } from '../infrastructure/http/workouts.controller';
import { GenerateWeeklyWorkoutPlanUseCase } from '../core/application/workouts/use-cases/generate-weekly-workout-plan.usecase';
import { GetWorkoutPlanUseCase } from '../core/application/workouts/use-cases/get-workout-plan.usecase';
import { WORKOUT_REPOSITORY } from '../core/application/workouts/ports/out.workout-repository.port';
import { WorkoutPrismaRepository } from '../infrastructure/persistence/prisma/workout.prisma.repository';
import { WORKOUT_PLANNER_AGENT } from '../core/application/workouts/ports/out.workout-planner-agent.port';
import { OpenAIWorkoutPlannerAgent } from '../infrastructure/ai/workout-planner.agent.openai';
import { PROFILE_REPO } from '../core/application/profile/ports/out.profile-repo.port';
import { ProfilesPrismaRepository } from '../infrastructure/persistence/prisma/profiles.prisma.repository';
import { PrismaModule } from '../infrastructure/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WorkoutsController],
  providers: [
    GenerateWeeklyWorkoutPlanUseCase,
    GetWorkoutPlanUseCase,
    { provide: WORKOUT_REPOSITORY, useClass: WorkoutPrismaRepository },
    { provide: WORKOUT_PLANNER_AGENT, useClass: OpenAIWorkoutPlannerAgent },
    { provide: PROFILE_REPO, useClass: ProfilesPrismaRepository },
  ],
  exports: [],
})
export class WorkoutsModule {}
