import { IsString, IsOptional, IsUrl } from 'class-validator';

export class AnalyzeMealDto {
  @IsString()
  @IsUrl()
  imageUrl: string;

  @IsOptional()
  @IsString()
  description?: string; // Descripción opcional del usuario para ayudar a la IA
}
