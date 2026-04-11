import { IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ListPaymentsAdminDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @Type(() => Number)
  @IsOptional()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsOptional()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
