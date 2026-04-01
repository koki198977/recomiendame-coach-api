import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class NutritionPer100gDto {
  @IsNumber()
  @Min(0)
  calories: number;

  @IsNumber()
  @Min(0)
  protein: number;

  @IsNumber()
  @Min(0)
  carbohydrates: number;

  @IsNumber()
  @Min(0)
  fat: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  saturatedFat?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sugar?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fiber?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sodium?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salt?: number;
}

export class NutriscoreDto {
  @IsIn(['A', 'B', 'C', 'D', 'E'])
  grade: 'A' | 'B' | 'C' | 'D' | 'E';

  @IsOptional()
  @IsNumber()
  score?: number;
}

export class ProductScoresDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => NutriscoreDto)
  nutriscore?: NutriscoreDto;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  novaGroup?: number;
}

export class CreateProductDto {
  @IsString()
  barcode: string;

  @IsString()
  productName: string;

  @ValidateNested()
  @Type(() => NutritionPer100gDto)
  nutritionPer100g: NutritionPer100gDto;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  ingredients?: string;

  @IsOptional()
  @IsString()
  allergens?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductScoresDto)
  scores?: ProductScoresDto;
}
