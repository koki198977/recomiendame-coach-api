import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { FreeExerciseLog } from '../../../../core/domain/workouts/free-exercise.entity';
import { GetFreeExerciseHistoryDto } from '../dto/get-free-exercise-history.dto';
import {
  FREE_EXERCISE_REPOSITORY,
  FreeExerciseRepositoryPort,
} from '../ports/out.free-exercise-repository.port';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class GetFreeExerciseHistoryUseCase {
  constructor(
    @Inject(FREE_EXERCISE_REPOSITORY)
    private readonly freeExerciseRepo: FreeExerciseRepositoryPort,
  ) {}

  async execute(
    userId: string,
    dto: GetFreeExerciseHistoryDto,
  ): Promise<FreeExerciseLog[]> {
    if (!DATE_REGEX.test(dto.startDate) || !DATE_REGEX.test(dto.endDate)) {
      throw new BadRequestException(
        'startDate y endDate deben tener formato YYYY-MM-DD',
      );
    }

    if (dto.startDate > dto.endDate) {
      throw new BadRequestException(
        'startDate no puede ser posterior a endDate',
      );
    }

    const start = new Date(dto.startDate + 'T00:00:00.000Z');
    const end = new Date(dto.endDate + 'T23:59:59.999Z');

    return this.freeExerciseRepo.findByUserAndDateRange(userId, start, end);
  }
}
