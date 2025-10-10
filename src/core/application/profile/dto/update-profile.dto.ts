import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export enum SexDto { MALE='MALE', FEMALE='FEMALE', OTHER='OTHER', UNSPECIFIED='UNSPECIFIED' }
export enum ActivityLevelDto { SEDENTARY='SEDENTARY', LIGHT='LIGHT', MODERATE='MODERATE', ACTIVE='ACTIVE', VERY_ACTIVE='VERY_ACTIVE' }

export class UpdateProfileDto {
  @IsOptional() @IsEnum(SexDto) sex?: SexDto;
  @IsOptional() @IsDateString() birthDate?: string;           // YYYY-MM-DD
  @IsOptional() @IsInt() @Min(80) @Max(250) heightCm?: number;
  @IsOptional() @IsNumber() @Min(20) @Max(400) weightKg?: number;
  @IsOptional() @IsEnum(ActivityLevelDto) activityLevel?: ActivityLevelDto;
  @IsOptional() country?: string;
  @IsOptional() @IsInt() @Min(0) @Max(3) budgetLevel?: number;
  @IsOptional() @IsInt() @Min(5) @Max(180) cookTimePerMeal?: number;
}
