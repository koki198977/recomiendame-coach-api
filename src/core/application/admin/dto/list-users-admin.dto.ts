import { IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ListUsersAdminDto {
  @IsOptional()
  @IsString()
  search?: string;

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
