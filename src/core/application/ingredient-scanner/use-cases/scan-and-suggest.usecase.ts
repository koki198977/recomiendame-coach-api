import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { ScanIngredientsDto } from '../dto/scan-ingredients.dto';
import { ScanAndSuggestResult } from '../dto/dish-suggestion.dto';
import {
  INGREDIENT_SCANNER_AGENT,
  IngredientScannerAgentPort,
} from '../ports/out.ingredient-scanner-agent.port';

@Injectable()
export class ScanAndSuggestUseCase {
  constructor(
    @Inject(INGREDIENT_SCANNER_AGENT)
    private readonly agent: IngredientScannerAgentPort,
    private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, dto: ScanIngredientsDto): Promise<ScanAndSuggestResult> {
    // Obtener perfil y alergias del usuario
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: { select: { nutritionGoal: true } },
        allergies: { include: { allergy: { select: { name: true } } } },
      },
    });

    // Calcular kcal consumidas hoy
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayLogs = await this.prisma.mealLog.findMany({
      where: { userId, date: { gte: startOfDay } },
      select: { kcal: true },
    });

    const todayConsumed = todayLogs.reduce((sum, log) => sum + log.kcal, 0);
    const allergies = user?.allergies.map((a) => a.allergy.name).join(', ') || undefined;

    return this.agent.scanAndSuggest({
      imagesBase64: dto.imagesBase64,
      userContext: {
        goal: user?.profile?.nutritionGoal ?? 'MAINTAIN_WEIGHT',
        caloriesTarget: 2000, // default; se puede calcular con TDEE si se necesita
        todayConsumed,
        allergies,
      },
    });
  }
}
