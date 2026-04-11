import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateAllergyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}

export class UpdateAllergyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}

export class CreateHealthConditionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  label: string;
}

export class UpdateHealthConditionDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  label?: string;
}

export class CreateCuisineDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}

export class UpdateCuisineDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
