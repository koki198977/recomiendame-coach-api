import { Module } from '@nestjs/common';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { IngredientScannerController } from '../infrastructure/http/ingredient-scanner.controller';
import { ScanAndSuggestUseCase } from '../core/application/ingredient-scanner/use-cases/scan-and-suggest.usecase';
import { OpenAIIngredientScannerAgent } from '../infrastructure/ai/ingredient-scanner.agent.openai';
import { INGREDIENT_SCANNER_AGENT } from '../core/application/ingredient-scanner/ports/out.ingredient-scanner-agent.port';

@Module({
  imports: [PrismaModule],
  controllers: [IngredientScannerController],
  providers: [
    ScanAndSuggestUseCase,
    { provide: INGREDIENT_SCANNER_AGENT, useClass: OpenAIIngredientScannerAgent },
  ],
})
export class IngredientScannerModule {}
