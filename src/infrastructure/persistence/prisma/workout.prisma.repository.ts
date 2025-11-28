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

  async findByUserAndWeek(userId: string, weekStart: Date): Promise<WorkoutPlan | null> {
    const found = await this.prisma.workoutPlan.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
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

  private mapToDomain(raw: any): WorkoutPlan {
    return {
      id: raw.id,
      userId: raw.userId,
      weekStart: raw.weekStart,
      notes: raw.notes,
      days: raw.days.map((d: any) => ({
        id: d.id,
        dayIndex: d.dayIndex,
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
        })),
      })),
    };
  }
}
