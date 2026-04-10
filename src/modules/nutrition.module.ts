import { Module } from '@nestjs/common';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { NutritionController } from '../infrastructure/http/nutrition.controller';
import { GetProductByBarcodeUseCase } from '../core/application/nutrition/use-cases/get-product-by-barcode.usecase';
import { CreateProductUseCase } from '../core/application/nutrition/use-cases/create-product.usecase';
import { PrismaProductRepository } from '../infrastructure/persistence/prisma/nutrition.prisma.repository';
import { PRODUCT_REPOSITORY } from '../core/application/nutrition/ports/out.nutrition-repository.port';
import { UsageLimitService } from '../core/application/plan/usage-limit.service';
import { USAGE_LOG_PORT } from '../core/application/plan/ports/out.usage-log.port';
import { UsageLogPrismaRepository } from '../infrastructure/database/usage-log.prisma.repository';

@Module({
  imports: [PrismaModule],
  controllers: [NutritionController],
  providers: [
    GetProductByBarcodeUseCase,
    CreateProductUseCase,
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
    UsageLimitService,
    { provide: USAGE_LOG_PORT, useClass: UsageLogPrismaRepository },
  ],
})
export class NutritionModule {}
