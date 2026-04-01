import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetProductByBarcodeUseCase } from '../../core/application/nutrition/use-cases/get-product-by-barcode.usecase';
import { CreateProductUseCase } from '../../core/application/nutrition/use-cases/create-product.usecase';
import { CreateProductDto } from '../../core/application/nutrition/dto/create-product.dto';

@Controller('nutrition')
export class NutritionController {
  constructor(
    private readonly getProductByBarcode: GetProductByBarcodeUseCase,
    private readonly createProduct: CreateProductUseCase,
  ) {}

  @Get('products/:barcode')
  @UseGuards(JwtAuthGuard)
  async getProduct(@Param('barcode') barcode: string) {
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
