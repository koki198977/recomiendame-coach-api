import { IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';

export class CreatePostDto {
  @IsOptional() @IsString() @MaxLength(500)
  caption?: string;

  @IsOptional() @IsString()
  challengeId?: string; // si postea dentro de un desafío

  @IsOptional() @IsUrl()
  mediaUrl?: string;    // por ahora aceptamos URL directa (CDN / S3)
}
