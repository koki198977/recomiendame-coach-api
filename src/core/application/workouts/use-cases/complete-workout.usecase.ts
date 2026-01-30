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

      // 3. Actualizar el día como completado (sin validar si ya estaba completado)
      const updatedDay = await this.workoutRepo.completeWorkoutDay({
        workoutDayId: day.id,
        completed: true,
        completedAt: new Date(dto.completedAt),
        durationMinutes: dto.durationMinutes,
        caloriesBurned: dto.caloriesBurned,
      });

      // 4. Actualizar ejercicios individuales (incluyendo sets, reps, weight modificados)
      for (const exerciseDto of dto.exercises) {
        const exercise = day.exercises.find((e) => e.name === exerciseDto.name);
        if (exercise && exercise.id) {
          await this.workoutRepo.updateExercise(exercise.id, {
            completed: exerciseDto.completed,
            sets: exerciseDto.sets,
            reps: exerciseDto.reps,
            weight: exerciseDto.weight?.toString(),
            notes: exerciseDto.notes,
          });
        }
      }

      // 5. Registrar/actualizar calorías en ActivityLog (usar upsert)
      await this.workoutRepo.upsertActivity({
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
        message: day.completed ? 'Entrenamiento actualizado exitosamente' : 'Entrenamiento completado exitosamente',
      });
    } catch (error: any) {
      return err(error);
    }
  }

  private isoWeekToDate(isoWeek: string): Date {
    // Usar la misma lógica que Week.fromISOWeek para consistencia
    const m = isoWeek.match(/^(\d{4})-W(\d{2})$/);
    if (!m) throw new Error(`Semana inválida: ${isoWeek}`);
    const [_, y, w] = m;
    const year = +y;
    const week = +w;
    
    // Algoritmo idéntico a Week.fromISOWeek
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const dayOfWeek = (jan4.getUTCDay() + 6) % 7; // 0=lun
    const week1Monday = new Date(jan4);
    week1Monday.setUTCDate(jan4.getUTCDate() - dayOfWeek);
    const monday = new Date(week1Monday);
    monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
    
    return monday;
  }
}
