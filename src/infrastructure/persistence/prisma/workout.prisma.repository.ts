import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WorkoutRepositoryPort } from '../../../core/application/workouts/ports/out.workout-repository.port';
import { WorkoutPlan } from '../../../core/domain/workouts/entities';
import { Result, ok, err } from '../../../core/domain/common/result';

@Injectable()
export class WorkoutPrismaRepository implements WorkoutRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(plan: WorkoutPlan): Promise<Result<WorkoutPlan>> {
    try {
      const saved = await this.prisma.workoutPlan.create({
        data: {
          userId: plan.userId,
          weekStart: plan.weekStart,
          notes: plan.notes,
          days: {
            create: plan.days.map((d) => ({
              dayIndex: d.dayIndex,
              exercises: {
                create: d.exercises.map((e) => ({
                  name: e.name,
                  sets: e.sets,
                  reps: e.reps,
                  weight: e.weight,
                  rpe: e.rpe,
                  restSeconds: e.restSeconds,
                  notes: e.notes,
                  order: e.order,
                  muscleGroup: e.muscleGroup,
                  equipment: e.equipment,
                  instructions: e.instructions,
                  videoQuery: e.videoQuery,
                })),
              },
            })),
          },
        },
        include: {
          days: {
            include: {
              exercises: true,
            },
          },
        },
      });

      return ok(this.mapToDomain(saved));
    } catch (e: any) {
      return err(e);
    }
  }

  async findByUserAndWeek(userId: string, weekStart: Date | string): Promise<WorkoutPlan | null> {
    const weekDate = typeof weekStart === 'string' ? new Date(weekStart) : weekStart;
    
    const found = await this.prisma.workoutPlan.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart: weekDate,
        },
      },
      include: {
        days: {
          include: {
            exercises: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { dayIndex: 'asc' },
        },
      },
    });

    if (!found) return null;
    return this.mapToDomain(found);
  }

  async findById(id: string): Promise<WorkoutPlan | null> {
    const found = await this.prisma.workoutPlan.findUnique({
      where: { id },
      include: {
        days: {
          include: {
            exercises: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { dayIndex: 'asc' },
        },
      },
    });

    if (!found) return null;
    return this.mapToDomain(found);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.workoutPlan.delete({
      where: { id },
    });
  }

  async update(id: string, updates: Partial<WorkoutPlan>): Promise<void> {
    await this.prisma.workoutPlan.update({
      where: { id },
      data: {
        notes: updates.notes,
        // For now, we only support updating notes. 
        // Deep updates for days/exercises would require more complex logic.
      },
    });
  }

  async completeWorkoutDay(params: {
    workoutDayId: string;
    completed: boolean;
    completedAt: Date;
    durationMinutes: number;
    caloriesBurned: number;
  }): Promise<any> {
    return await this.prisma.workoutDay.update({
      where: { id: params.workoutDayId },
      data: {
        completed: params.completed,
        completedAt: params.completedAt,
        durationMinutes: params.durationMinutes,
        caloriesBurned: params.caloriesBurned,
      },
      include: {
        exercises: true,
      },
    });
  }

  async updateExerciseCompletion(exerciseId: string, completed: boolean, notes?: string): Promise<void> {
    await this.prisma.workoutExercise.update({
      where: { id: exerciseId },
      data: {
        completed,
        ...(notes && { notes }),
      },
    });
  }

  async updateExercise(exerciseId: string, updates: {
    completed?: boolean;
    sets?: number;
    reps?: string;
    weight?: string;
    notes?: string;
  }): Promise<void> {
    await this.prisma.workoutExercise.update({
      where: { id: exerciseId },
      data: {
        ...(updates.completed !== undefined && { completed: updates.completed }),
        ...(updates.sets !== undefined && { sets: updates.sets }),
        ...(updates.reps !== undefined && { reps: updates.reps }),
        ...(updates.weight !== undefined && { weight: updates.weight }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
      },
    });
  }

  async logActivity(params: {
    userId: string;
    date: Date;
    minutes: number;
    kcal: number;
  }): Promise<void> {
    // Buscar si ya existe un log para ese día
    const existing = await this.prisma.activityLog.findFirst({
      where: {
        userId: params.userId,
        date: {
          gte: new Date(params.date.setHours(0, 0, 0, 0)),
          lt: new Date(params.date.setHours(23, 59, 59, 999)),
        },
      },
    });

    if (existing) {
      // Sumar a los valores existentes
      await this.prisma.activityLog.update({
        where: { id: existing.id },
        data: {
          minutes: (existing.minutes || 0) + params.minutes,
          kcal: (existing.kcal || 0) + params.kcal,
        },
      });
    } else {
      // Crear nuevo registro
      await this.prisma.activityLog.create({
        data: {
          userId: params.userId,
          date: params.date,
          minutes: params.minutes,
          kcal: params.kcal,
        },
      });
    }
  }

  async getActivityStats(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return await this.prisma.activityLog.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  private mapToDomain(raw: any): WorkoutPlan {
    return {
      id: raw.id,
      userId: raw.userId,
      weekStart: raw.weekStart,
      notes: raw.notes,
      days: raw.days.map((d: any) => ({
        id: d.id,
        dayIndex: d.dayIndex,
        completed: d.completed,
        completedAt: d.completedAt,
        durationMinutes: d.durationMinutes,
        caloriesBurned: d.caloriesBurned,
        exercises: d.exercises.map((e: any) => ({
          id: e.id,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          weight: e.weight,
          rpe: e.rpe,
          restSeconds: e.restSeconds,
          notes: e.notes,
          order: e.order,
          muscleGroup: e.muscleGroup,
          equipment: e.equipment,
          instructions: e.instructions,
          videoQuery: e.videoQuery,
          completed: e.completed,
        })),
      })),
    };
  }
}
