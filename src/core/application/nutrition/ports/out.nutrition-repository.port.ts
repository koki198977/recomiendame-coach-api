export const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';

export interface NutritionPer100g {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  saturatedFat: number | null;
  sugar: number | null;
  fiber: number | null;
  sodium: number | null;
  salt: number | null;
}

export interface ProductScores {
  nutriscore?: { grade: 'A' | 'B' | 'C' | 'D' | 'E'; score?: number };
  novaGroup?: 1 | 2 | 3 | 4;
}

export interface ProductRecord {
  id: string;
  barcode: string | null;
  productName: string;
  brand: string | null;
  imageUrl: string | null;
  ingredients: string | null;
  allergens: string | null;
  nutritionPer100g: NutritionPer100g;
  scores: ProductScores;
  createdAt: Date;
}

export interface CreateProductData {
  barcode: string | null;
  productName: string;
  brand?: string | null;
  imageUrl?: string | null;
  ingredients?: string | null;
  allergens?: string | null;
  nutritionPer100g: NutritionPer100g;
  scores?: ProductScores;
}

export interface ProductRepositoryPort {
  findByBarcode(barcode: string): Promise<ProductRecord | null>;
  existsByBarcode(barcode: string): Promise<boolean>;
  create(data: CreateProductData): Promise<ProductRecord>;
}
