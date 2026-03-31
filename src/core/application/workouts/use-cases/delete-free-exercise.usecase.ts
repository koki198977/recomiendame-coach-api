import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  FREE_EXERCISE_REPOSITORY,
  FreeExerciseRepositoryPort,
} from '../ports/out.free-exercise-repository.port';

@Injectable()
export class DeleteFreeExerciseUseCase {
  constructor(
    @Inject(FREE_EXERCISE_REPOSITORY)
    private readonly freeExerciseRepo: FreeExerciseRepositoryPort,
  ) {}

  async execute(userId: string, id: string): Promise<void> {
    await this.freeExerciseRepo.delete(id, userId);
  }
}
