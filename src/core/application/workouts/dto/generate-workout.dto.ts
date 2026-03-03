import { IsArray, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class GenerateWorkoutDto {
  @IsString()
  isoWeek: string;

  @IsInt()
  @Min(1)
  daysAvailable: number;

  @IsString()
  goal: string;

  @IsOptional()
  @IsString()
  environment?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipmentImageUrls?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  startDayIndex?: number; // 1=Lunes, 2=Martes, ..., 7=Domingo
}
