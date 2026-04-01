CREATE TABLE "NutritionProduct" (
    "id" TEXT NOT NULL,
    "barcode" TEXT,
    "productName" TEXT NOT NULL,
    "brand" TEXT,
    "nutritionPer100g" JSONB NOT NULL,
    "scores" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NutritionProduct_barcode_key" ON "NutritionProduct"("barcode");
CREATE INDEX "NutritionProduct_productName_idx" ON "NutritionProduct"("productName");
