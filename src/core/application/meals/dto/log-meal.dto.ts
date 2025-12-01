import { IsString, IsInt, IsOptional, IsEnum, IsDateString, Min } from 'class-validator';

export enum MealSlotDto {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SNACK = 'SNACK',
}

export class LogMealDto {
  @IsOptional()
  @IsString()
  mealId?: string; // ID de comida del plan (si es del plan)

  @IsEnum(MealSlotDto)
  slot: MealSlotDto;

  @IsString()
  title: string;

  @IsInt()
  @Min(0)
  kcal: number;

  @IsInt()
  @Min(0)
  protein_g: number;

  @IsInt()
  @Min(0)
  carbs_g: number;

  @IsInt()
  @Min(0)
  fat_g: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsDateString()
  date?: string; // ISO date, default: hoy
}
