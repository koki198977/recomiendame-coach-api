import { IsArray, IsEnum, IsInt, IsOptional } from 'class-validator';

export enum CuisinePrefKindDto { LIKE='LIKE', DISLIKE='DISLIKE' }

export class UpdatePreferencesDto {
  // IDs de catálogo (ya existen en tablas allergy/healthCondition/cuisine)
  @IsOptional() @IsArray() allergyIds?: number[];          // replace total
  @IsOptional() @IsArray() conditionIds?: number[];        // replace total
  @IsOptional() @IsArray() cuisinesLike?: number[];        // replace total
  @IsOptional() @IsArray() cuisinesDislike?: number[];     // replace total
}
