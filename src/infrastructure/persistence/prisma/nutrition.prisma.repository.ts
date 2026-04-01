import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateProductData,
  NutritionPer100g,
  ProductRecord,
  ProductRepositoryPort,
  ProductScores,
} from '../../../core/application/nutrition/ports/out.nutrition-repository.port';

@Injectable()
export class PrismaProductRepository implements ProductRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByBarcode(barcode: string): Promise<ProductRecord | null> {
    const where = barcode === 'LABEL' ? { barcode: null } : { barcode };
    const raw = await this.prisma.nutritionProduct.findFirst({ where });
    return raw ? this.toRecord(raw) : null;
  }

  async existsByBarcode(barcode: string): Promise<boolean> {
    const raw = await this.prisma.nutritionProduct.findFirst({
      where: { barcode },
      select: { id: true },
    });
    return raw !== null;
  }

  async create(data: CreateProductData): Promise<ProductRecord> {
    const raw = await this.prisma.nutritionProduct.create({
      data: {
        barcode: data.barcode,
        productName: data.productName,
        brand: data.brand ?? null,
        imageUrl: data.imageUrl ?? null,
        ingredients: data.ingredients ?? null,
        allergens: data.allergens ?? null,
        nutritionPer100g: data.nutritionPer100g as object,
        scores: (data.scores ?? {}) as object,
      },
    });
    return this.toRecord(raw);
  }

  private toRecord(raw: {
    id: string;
    barcode: string | null;
    productName: string;
    brand: string | null;
    imageUrl: string | null;
    ingredients: string | null;
    allergens: string | null;
    nutritionPer100g: unknown;
    scores: unknown;
    createdAt: Date;
  }): ProductRecord {
    return {
      id: raw.id,
      barcode: raw.barcode,
      productName: raw.productName,
      brand: raw.brand,
      imageUrl: raw.imageUrl,
      ingredients: raw.ingredients,
      allergens: raw.allergens,
      nutritionPer100g: raw.nutritionPer100g as NutritionPer100g,
      scores: (raw.scores ?? {}) as ProductScores,
      createdAt: raw.createdAt,
    };
  }
}
