import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { UserPlan } from '@prisma/client';

export class UpdatePlanDto {
  @IsEnum(UserPlan)
  plan: UserPlan;

  @IsOptional()
  @IsDateString()
  planExpiresAt?: string;
}
