import { IsString, IsInt, IsArray, IsBoolean, IsOptional, IsDateString, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ExerciseCompletionDto {
  @IsString()
  name: string;

  @IsInt()
  @IsOptional()
  sets?: number;

  @IsString()
  @IsOptional()
  reps?: string;

  @IsInt()
  @IsOptional()
  weight?: number;

  @IsBoolean()
  completed: boolean;

  @IsString()
  @IsOptional()
  muscleGroup?: string;

  @IsString()
  @IsOptional()
  equipment?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CompleteWorkoutDto {
  @IsString()
  isoWeek: string;

  @IsInt()
  @Min(0)
  dayIndex: number;

  @IsInt()
  @Min(0)
  durationMinutes: number;

  @IsInt()
  @Min(0)
  caloriesBurned: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseCompletionDto)
  exercises: ExerciseCompletionDto[];

  @IsDateString()
  @IsOptional()
  completedAt?: string;
}
