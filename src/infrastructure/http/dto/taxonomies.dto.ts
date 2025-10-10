import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';

export class PageQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsInt() @Min(0) skip?: number;
  @IsOptional() @IsInt() @Min(1) take?: number;
}

export class CreateAllergyDto {
  @IsString() @IsNotEmpty() @Length(2, 80) name!: string;
}
export class UpdateAllergyDto {
  @IsString() @IsNotEmpty() @Length(2, 80) name!: string;
}

export class CreateConditionDto {
  @IsString() @IsNotEmpty() @Length(2, 16) code!: string;
  @IsString() @IsNotEmpty() @Length(2, 120) label!: string;
}
export class UpdateConditionDto {
  @IsOptional() @IsString() @Length(2, 16) code?: string;
  @IsOptional() @IsString() @Length(2, 120) label?: string;
}

export class CreateCuisineDto {
  @IsString() @IsNotEmpty() @Length(2, 80) name!: string;
}
export class UpdateCuisineDto {
  @IsString() @IsNotEmpty() @Length(2, 80) name!: string;
}
