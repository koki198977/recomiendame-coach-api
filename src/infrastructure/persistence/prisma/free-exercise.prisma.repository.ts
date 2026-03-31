import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FreeExerciseRepositoryPort } from '../../../core/application/workouts/ports/out.free-exercise-repository.port';
import { FreeExerciseLog } from '../../../core/domain/workouts/free-exercise.entity';

@Injectable()
export class FreeExercisePrismaRepository implements FreeExerciseRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(log: FreeExerciseLog): Promise<FreeExerciseLog> {
    const record = await this.prisma.freeExerciseLog.create({
      data: {
        userId: log.userId,
        activityType: log.activityType,
        durationMinutes: log.durationMinutes,
        distanceKm: log.distanceKm ?? null,
        caloriesBurned: log.caloriesBurned,
        caloriesEstimated: log.caloriesEstimated,
        customActivityName: log.customActivityName ?? null,
        date: log.date,
      },
    });

    return this.toEntity(record);
  }

  async findByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<FreeExerciseLog[]> {
    const records = await this.prisma.freeExerciseLog.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'desc' },
    });

    return records.map((r) => this.toEntity(r));
  }

  private toEntity(record: any): FreeExerciseLog {
    return {
      id: record.id,
      userId: record.userId,
      activityType: record.activityType,
      durationMinutes: record.durationMinutes,
      distanceKm: record.distanceKm != null ? Number(record.distanceKm) : null,
      caloriesBurned: record.caloriesBurned,
      caloriesEstimated: record.caloriesEstimated,
      customActivityName: record.customActivityName ?? null,
      date: record.date,
      createdAt: record.createdAt,
    };
  }
}
