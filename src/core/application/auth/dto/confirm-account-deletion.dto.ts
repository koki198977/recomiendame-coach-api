import { IsString } from 'class-validator';

export class ConfirmAccountDeletionDto {
  @IsString()
  token: string;
}