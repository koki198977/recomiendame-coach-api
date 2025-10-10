import { IsDateString, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpsertCheckinDto {
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsNumber() weightKg?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100) adherencePct?: number;
  @IsOptional() @IsInt() @Min(1) @Max(10) hungerLvl?: number;
  @IsOptional() notes?: string;
}
