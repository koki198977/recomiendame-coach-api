import { Body, Controller, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ScanAndSuggestUseCase } from '../../core/application/ingredient-scanner/use-cases/scan-and-suggest.usecase';
import { ScanIngredientsDto } from '../../core/application/ingredient-scanner/dto/scan-ingredients.dto';

@Controller('ingredient-scanner')
@UseGuards(JwtAuthGuard)
export class IngredientScannerController {
  constructor(private readonly scanAndSuggest: ScanAndSuggestUseCase) {}

  /**
   * POST /ingredient-scanner/suggest
   * Recibe 1-3 imágenes en base64, identifica ingredientes y sugiere 3 platos.
   */
  @Post('suggest')
  async suggest(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: ScanIngredientsDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId ?? req.user.sub;
    return this.scanAndSuggest.execute(userId, dto);
  }
}
