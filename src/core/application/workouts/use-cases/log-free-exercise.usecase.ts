import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { FreeExerciseLog } from '../../../domain/workouts/free-exercise.entity';
import { LogFreeExerciseDto } from '../dto/log-free-exercise.dto';
import {
  FREE_EXERCISE_REPOSITORY,
  FreeExerciseRepositoryPort,
} from '../ports/out.free-exercise-repository.port';

@Injectable()
export class LogFreeExerciseUseCase {
  constructor(
    @Inject(FREE_EXERCISE_REPOSITORY)
    private readonly freeExerciseRepo: FreeExerciseRepositoryPort,
  ) {}

  async execute(userId: string, dto: LogFreeExerciseDto): Promise<FreeExerciseLog> {
    if (dto.activityType === 'OTHER') {
      if (
        !dto.customActivityName ||
        dto.customActivityName.trim().length === 0 ||
        dto.customActivityName.length > 100
      ) {
        throw new BadRequestException(
          'customActivityName es requerido cuando activityType es OTHER y debe tener entre 1 y 100 caracteres',
        );
      }
    }

    const customActivityName = dto.activityType === 'OTHER' ? dto.customActivityName! : null;

    const date = dto.date
      ? new Date(dto.date + 'T00:00:00.000Z')
      : new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z');

    const entity: FreeExerciseLog = {
      userId,
      activityType: dto.activityType,
      durationMinutes: dto.durationMinutes,
      caloriesBurned: dto.caloriesBurned,
      caloriesEstimated: dto.caloriesEstimated,
      distanceKm: dto.distanceKm ?? null,
      customActivityName,
      date,
    };

    const saved = await this.freeExerciseRepo.save(entity);

    return saved;
  }
}
