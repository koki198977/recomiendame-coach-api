import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Length, Max, Min } from 'class-validator';

export class PageQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take: number = 20;
}

// Allergies
export class CreateAllergyDto {
  @IsString() @IsNotEmpty() @Length(2, 60) name!: string;
}
export class UpdateAllergyDto {
  @IsString() @IsNotEmpty() @Length(2, 60) name!: string;
}

// Conditions
export class CreateConditionDto {
  @IsString() @IsNotEmpty() @Length(2, 40) code!: string;
  @IsString() @IsNotEmpty() @Length(2, 120) label!: string;
}
export class UpdateConditionDto {
  @IsString() @IsNotEmpty() @Length(2, 40) code!: string;
  @IsString() @IsNotEmpty() @Length(2, 120) label!: string;
}

// Cuisines
export class CreateCuisineDto {
  @IsString() @IsNotEmpty() @Length(2, 60) name!: string;
}
export class UpdateCuisineDto {
  @IsString() @IsNotEmpty() @Length(2, 60) name!: string;
}
