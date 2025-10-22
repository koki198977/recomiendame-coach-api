import { IsString, IsOptional } from 'class-validator';

export class DeleteUserDto {
  @IsString()
  @IsOptional()
  confirmation?: string; // Para confirmar con "DELETE" o similar
}