import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GenerateWorkoutDto {
  @IsString()
  isoWeek: string;

  @IsInt()
  @Min(1)
  daysAvailable: number;

  @IsString()
  goal: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipmentImageUrls?: string[];
}
