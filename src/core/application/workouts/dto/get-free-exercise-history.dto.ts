import { IsNotEmpty, Matches } from 'class-validator';

export class GetFreeExerciseHistoryDto {
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate: string;

  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate: string;
}
