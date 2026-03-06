import { IsString, IsOptional, IsUrl, ValidateIf } from 'class-validator';

export class AnalyzeMealDto {
  @IsOptional()
  @ValidateIf((o) => o.imageUrl && o.imageUrl !== '')
  @IsString()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  description?: string; // Descripción del usuario (requerida si no hay imagen)
}
