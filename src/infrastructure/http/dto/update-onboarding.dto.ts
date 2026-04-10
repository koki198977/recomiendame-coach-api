import { IsBoolean, IsInt, Min } from 'class-validator';

export class UpdateOnboardingDto {
  @IsBoolean()
  completed: boolean;

  @IsInt()
  @Min(0)
  step: number;
}
