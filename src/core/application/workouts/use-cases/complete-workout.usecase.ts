import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { WORKOUT_REPOSITORY, WorkoutRepositoryPort } from '../ports/out.workout-repository.port';
import { Result, ok, err } from '../../../domain/common/result';
import { CompleteWorkoutDto } from '../dto/complete-workout.dto';

@Injectable()
export class CompleteWorkoutUseCase {
  constructor(
    @Inject(WORKOUT_REPOSITORY)
    private readonly workoutRepo: WorkoutRepositoryPort,
  ) {}

  async execute(
    userId: string,
    dto: CompleteWorkoutDto,
  ): Promise<Result<any, Error>> {
    try {
      // Convertir isoWeek a fecha (ej: "2024-W49" -> fecha del lunes de esa semana)
      const weekStart = this.isoWeekToDate(dto.isoWeek);
      
      // 1. Buscar el plan de la semana
      const plan = await this.workoutRepo.findByUserAndWeek(userId, weekStart);
      if (!plan) {
        return err(new NotFoundException(`No se encontró plan para la semana ${dto.isoWeek}`));
      }

      // 2. Buscar el día específico
      const day = plan.days.find((d) => d.dayIndex === dto.dayIndex);
      if (!day) {
        return err(new NotFoundException(`No se encontró el día ${dto.dayIndex} en el plan`));
      }

      if (!day.id) {
        return err(new BadRequestException('El día de entrenamiento no tiene ID válido'));
      }

      // 3. Validar que no esté ya completado
      if (day.completed) {
        return err(new BadRequestException('Este entrenamiento ya fue completado'));
      }

      // 4. Actualizar el día como completado
      const updatedDay = await this.workoutRepo.completeWorkoutDay({
        workoutDayId: day.id,
        completed: true,
        completedAt: new Date(dto.completedAt),
        durationMinutes: dto.durationMinutes,
        caloriesBurned: dto.caloriesBurned,
      });

      // 5. Actualizar ejercicios individuales
      for (const exerciseDto of dto.exercises) {
        const exercise = day.exercises.find((e) => e.name === exerciseDto.name);
        if (exercise && exercise.id) {
          await this.workoutRepo.updateExerciseCompletion(
            exercise.id,
            exerciseDto.completed,
            exerciseDto.notes,
          );
        }
      }

      // 6. Registrar calorías en ActivityLog
      await this.workoutRepo.logActivity({
        userId,
        date: new Date(dto.completedAt),
        minutes: dto.durationMinutes,
        kcal: dto.caloriesBurned,
      });

      return ok({
        success: true,
        workoutDay: updatedDay,
        caloriesBurned: dto.caloriesBurned,
        completedExercises: dto.completedExercises,
        totalExercises: dto.totalExercises,
      });
    } catch (error: any) {
      return err(error);
    }
  }

  private isoWeekToDate(isoWeek: string): Date {
    // Formato: "2024-W49"
    const [year, week] = isoWeek.split('-W').map(Number);
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const isoWeekStart = simple;
    if (dow <= 4) {
      isoWeekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      isoWeekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }
    return isoWeekStart;
  }
}
