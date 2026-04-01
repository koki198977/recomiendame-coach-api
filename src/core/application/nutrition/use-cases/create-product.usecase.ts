import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateProductDto } from '../dto/create-product.dto';
import {
  PRODUCT_REPOSITORY,
  ProductRecord,
  ProductRepositoryPort,
} from '../ports/out.nutrition-repository.port';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly repo: ProductRepositoryPort,
  ) {}

  async execute(dto: CreateProductDto): Promise<{ product: ProductRecord }> {
    const isLabel = dto.barcode === 'LABEL';

    if (!isLabel) {
      const exists = await this.repo.existsByBarcode(dto.barcode);
      if (exists) {
        throw new ConflictException(
          `A product with barcode "${dto.barcode}" already exists`,
        );
      }
    }

    const product = await this.repo.create({
      barcode: isLabel ? null : dto.barcode,
      productName: dto.productName,
      brand: dto.brand ?? null,
      imageUrl: dto.imageUrl ?? null,
      ingredients: dto.ingredients ?? null,
      allergens: dto.allergens ?? null,
      nutritionPer100g: {
        calories: dto.nutritionPer100g.calories,
        protein: dto.nutritionPer100g.protein,
        carbohydrates: dto.nutritionPer100g.carbohydrates,
        fat: dto.nutritionPer100g.fat,
        saturatedFat: dto.nutritionPer100g.saturatedFat ?? null,
        sugar: dto.nutritionPer100g.sugar ?? null,
        fiber: dto.nutritionPer100g.fiber ?? null,
        sodium: dto.nutritionPer100g.sodium ?? null,
        salt: dto.nutritionPer100g.salt ?? null,
      },
      scores: dto.scores
        ? {
            nutriscore: dto.scores.nutriscore,
            novaGroup: dto.scores.novaGroup as 1 | 2 | 3 | 4 | undefined,
          }
        : {},
    });

    return { product };
  }
}
