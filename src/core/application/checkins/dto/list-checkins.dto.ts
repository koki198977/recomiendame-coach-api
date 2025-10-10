import { IsDateString } from 'class-validator';

export class ListCheckinsDto {
  @IsDateString() from!: string;   // YYYY-MM-DD
  @IsDateString() to!: string;     // YYYY-MM-DD (inclusive)
}
