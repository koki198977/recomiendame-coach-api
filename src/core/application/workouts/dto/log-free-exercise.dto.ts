import {
  IsEnum,
  IsInt,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsString,
  Min,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ActivityType } from '../../../domain/workouts/free-exercise.entity';

const ActivityTypeValues: Record<string, string> = {
  RUNNING: 'RUNNING',
  WALKING: 'WALKING',
  CYCLING: 'CYCLING',
  SWIMMING: 'SWIMMING',
  ELLIPTICAL: 'ELLIPTICAL',
  ROWING: 'ROWING',
  JUMP_ROPE: 'JUMP_ROPE',
  OTHER: 'OTHER',
};

export class LogFreeExerciseDto {
  @IsEnum(ActivityTypeValues)
  activityType: ActivityType;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsInt()
  @Min(0)
  caloriesBurned: number;

  @IsBoolean()
  caloriesEstimated: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceKm?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  customActivityName?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}
