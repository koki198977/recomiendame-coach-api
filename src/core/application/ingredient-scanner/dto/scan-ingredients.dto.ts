import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class ScanIngredientsDto {
  /**
   * Array de 1 a 3 imágenes en base64 (JPEG/PNG).
   * Permite fotografiar ingredientes desde distintos ángulos o ubicaciones.
   */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  imagesBase64: string[];
}
