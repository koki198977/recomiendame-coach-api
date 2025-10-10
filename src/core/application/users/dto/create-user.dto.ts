import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsOptional() @IsString() id?: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;
}
