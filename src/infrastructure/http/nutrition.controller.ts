import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetProductByBarcodeUseCase } from '../../core/application/nutrition/use-cases/get-product-by-barcode.usecase';
import { CreateProductUseCase } from '../../core/application/nutrition/use-cases/create-product.usecase';
import { CreateProductDto } from '../../core/application/nutrition/dto/create-product.dto';
import { UsageLimitService } from '../../core/application/plan/usage-limit.service';
import { FEATURE_GATES } from '../../core/application/plan/feature-gates';

@Controller('nutrition')
export class NutritionController {
  constructor(
    private readonly getProductByBarcode: GetProductByBarcodeUseCase,
    private readonly createProduct: CreateProductUseCase,
    private readonly usageLimitService: UsageLimitService,
  ) {}

  @Get('products/:barcode')
  @UseGuards(JwtAuthGuard)
  async getProduct(@Param('barcode') barcode: string, @Req() req: any) {
    const userId = req.user.userId ?? req.user.sub;

    if (req.user?.plan !== 'PRO') {
      const gate = FEATURE_GATES['barcode_scan'];
      const check = await this.usageLimitService.checkAndIncrement(
        userId, 'barcode_scan', gate.limit!, gate.window!,
      );
      if (!check.allowed) {
        throw new ForbiddenException({
          message: `Límite de escaneos alcanzado (${check.limit}/día). Resetea a las ${check.resetsAt.toISOString()}`,
          feature: 'barcode_scan',
          current: check.current,
          limit: check.limit,
          resetsAt: check.resetsAt,
        });
      }
    }

    return this.getProductByBarcode.execute(barcode);
  }

  @Post('products')
  @UseGuards(JwtAuthGuard)
  async createProductHandler(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: CreateProductDto,
  ) {
    return this.createProduct.execute(dto);
  }
}
