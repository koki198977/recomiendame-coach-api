import { IsString, IsEmail, IsOptional } from 'class-validator';

export class SendContactEmailDto {
  @IsString()
  @IsEmail()
  to: string;

  @IsString()
  @IsEmail()
  from: string;

  @IsString()
  @IsEmail()
  @IsOptional()
  replyTo?: string;

  @IsString()
  subject: string;

  @IsString()
  html: string;

  @IsString()
  @IsOptional()
  text?: string;
}
