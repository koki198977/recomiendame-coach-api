import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  ProductRecord,
  ProductRepositoryPort,
} from '../ports/out.nutrition-repository.port';

@Injectable()
export class GetProductByBarcodeUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly repo: ProductRepositoryPort,
  ) {}

  async execute(barcode: string): Promise<ProductRecord> {
    const product = await this.repo.findByBarcode(barcode);

    if (!product) {
      throw new NotFoundException(`Product with barcode "${barcode}" not found`);
    }

    return product;
  }
}
