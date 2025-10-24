import { Injectable } from '@nestjs/common';

interface ConversionRule {
  from: string;
  to: string;
  factor: number; // factor de conversión
  ingredientPattern?: RegExp; // patrón para ingredientes específicos
}

@Injectable()
export class UnitConverterService {
  // Patrones para normalizar nombres de ingredientes
  private readonly ingredientNormalizations: Array<{
    pattern: RegExp;
    baseName: string;
  }> = [
    // Cebolla y variaciones
    { pattern: /^cebolla\s*(picada|cortada|rebanada|en\s*cubos|en\s*juliana|fileteada)?$/i, baseName: 'cebolla' },
    
    // Tomate y variaciones
    { pattern: /^tomate\s*(picado|cortado|rebanado|en\s*cubos|cherry|roma)?$/i, baseName: 'tomate' },
    
    // Ajo y variaciones
    { pattern: /^ajo\s*(picado|molido|en\s*polvo|dientes?\s*de)?$/i, baseName: 'ajo' },
    
    // Cilantro y variaciones
    { pattern: /^cilantro\s*(fresco|picado|hojas\s*de)?$/i, baseName: 'cilantro' },
    
    // Perejil y variaciones
    { pattern: /^perejil\s*(fresco|picado|hojas\s*de)?$/i, baseName: 'perejil' },
    
    // Pimiento y variaciones
    { pattern: /^pimiento\s*(rojo|verde|amarillo|picado|cortado|en\s*tiras)?$/i, baseName: 'pimiento' },
    
    // Zanahoria y variaciones
    { pattern: /^zanahoria\s*(picada|cortada|rallada|en\s*cubos|en\s*bastones)?$/i, baseName: 'zanahoria' },
    
    // Apio y variaciones
    { pattern: /^apio\s*(picado|cortado|en\s*cubos)?$/i, baseName: 'apio' },
    
    // Pollo y variaciones
    { pattern: /^(pechuga\s*de\s*)?pollo\s*(deshebrado|desmenuzado|cortado|en\s*cubos|cocido)?$/i, baseName: 'pollo' },
    { pattern: /^carne\s*de\s*pollo\s*(deshebrada|desmenuzada|cortada)?$/i, baseName: 'pollo' },
    
    // Carne de res y variaciones
    { pattern: /^carne\s*(de\s*res|asada|molida|picada|cortada)?$/i, baseName: 'carne de res' },
    { pattern: /^res\s*(molida|picada|cortada)?$/i, baseName: 'carne de res' },
    
    // Carne de cerdo y variaciones
    { pattern: /^carne\s*de\s*cerdo\s*(molida|picada|cortada)?$/i, baseName: 'carne de cerdo' },
    { pattern: /^cerdo\s*(molido|picado|cortado)?$/i, baseName: 'carne de cerdo' },
    
    // Queso y variaciones
    { pattern: /^queso\s*(fresco|rallado|en\s*cubos|blanco|panela|oaxaca)?$/i, baseName: 'queso' },
    
    // Frijoles y variaciones
    { pattern: /^frijoles?\s*(negros?|rojos?|pintos?|cocidos?|refritos?)?$/i, baseName: 'frijoles' },
    
    // Chiles y variaciones
    { pattern: /^chiles?\s*(poblanos?|jalapeños?|serranos?|chipotles?|picados?)?$/i, baseName: 'chiles' },
    
    // Tortillas y variaciones
    { pattern: /^tortillas?\s*(de\s*maíz|de\s*harina|pequeñas|grandes)?$/i, baseName: 'tortillas' },
    
    // Aceite y variaciones
    { pattern: /^aceite\s*(de\s*oliva|vegetal|de\s*canola|de\s*girasol)?$/i, baseName: 'aceite' },
    
    // Sal y variaciones
    { pattern: /^sal\s*(de\s*mesa|marina|gruesa|fina)?$/i, baseName: 'sal' },
    
    // Pimienta y variaciones
    { pattern: /^pimienta\s*(negra|blanca|molida|en\s*grano)?$/i, baseName: 'pimienta' },
    
    // Limón y variaciones
    { pattern: /^lim[oó]n\s*(verde|amarillo|en\s*jugo|exprimido)?$/i, baseName: 'limón' },
    
    // Aguacate y variaciones
    { pattern: /^aguacate\s*(maduro|en\s*cubos|rebanado)?$/i, baseName: 'aguacate' },
    
    // Huevo y variaciones
    { pattern: /^huevos?\s*(enteros?|batidos?|cocidos?)?$/i, baseName: 'huevo' },
    
    // Leche y variaciones
    { pattern: /^leche\s*(entera|descremada|evaporada|condensada)?$/i, baseName: 'leche' },
    
    // Crema y variaciones
    { pattern: /^crema\s*(agria|dulce|para\s*batir|espesa)?$/i, baseName: 'crema' },
  ];

  private readonly conversions: ConversionRule[] = [
    // Conversiones de peso
    { from: 'kg', to: 'g', factor: 1000 },
    { from: 'lb', to: 'g', factor: 453.592 },
    { from: 'oz', to: 'g', factor: 28.3495 },
    
    // Conversiones de volumen
    { from: 'l', to: 'ml', factor: 1000 },
    { from: 'litro', to: 'ml', factor: 1000 },
    { from: 'taza', to: 'ml', factor: 240 },
    { from: 'cup', to: 'ml', factor: 240 },
    { from: 'cda', to: 'ml', factor: 15 }, // cucharada
    { from: 'cdta', to: 'ml', factor: 5 }, // cucharadita
    { from: 'tbsp', to: 'ml', factor: 15 },
    { from: 'tsp', to: 'ml', factor: 5 },
    
    // Conversiones específicas para ingredientes comunes
    // Cebolla: 1 unidad mediana ≈ 150g
    { from: 'unidad', to: 'g', factor: 150, ingredientPattern: /cebolla/i },
    { from: 'pieza', to: 'g', factor: 150, ingredientPattern: /cebolla/i },
    
    // Tomate: 1 unidad mediana ≈ 120g
    { from: 'unidad', to: 'g', factor: 120, ingredientPattern: /tomate/i },
    { from: 'pieza', to: 'g', factor: 120, ingredientPattern: /tomate/i },
    
    // Huevo: 1 unidad ≈ 50g
    { from: 'unidad', to: 'g', factor: 50, ingredientPattern: /huevo/i },
    { from: 'pieza', to: 'g', factor: 50, ingredientPattern: /huevo/i },
    
    // Limón: 1 unidad ≈ 60g
    { from: 'unidad', to: 'g', factor: 60, ingredientPattern: /lim[oó]n/i },
    { from: 'pieza', to: 'g', factor: 60, ingredientPattern: /lim[oó]n/i },
    
    // Aguacate: 1 unidad ≈ 200g
    { from: 'unidad', to: 'g', factor: 200, ingredientPattern: /aguacate/i },
    { from: 'pieza', to: 'g', factor: 200, ingredientPattern: /aguacate/i },
    
    // Pimiento: 1 unidad ≈ 150g
    { from: 'unidad', to: 'g', factor: 150, ingredientPattern: /pimiento/i },
    { from: 'pieza', to: 'g', factor: 150, ingredientPattern: /pimiento/i },
    
    // Chile poblano: 1 unidad ≈ 80g
    { from: 'unidad', to: 'g', factor: 80, ingredientPattern: /chile.*poblano/i },
    { from: 'pieza', to: 'g', factor: 80, ingredientPattern: /chile.*poblano/i },
  ];

  /**
   * Convierte una cantidad de una unidad a otra
   */
  convert(quantity: number, fromUnit: string, toUnit: string, ingredientName: string): number | null {
    const normalizedFrom = this.normalizeUnit(fromUnit);
    const normalizedTo = this.normalizeUnit(toUnit);
    
    if (normalizedFrom === normalizedTo) {
      return quantity; // No necesita conversión
    }

    // Buscar conversión directa
    const directConversion = this.conversions.find(c => 
      c.from === normalizedFrom && 
      c.to === normalizedTo &&
      (!c.ingredientPattern || c.ingredientPattern.test(ingredientName))
    );

    if (directConversion) {
      return quantity * directConversion.factor;
    }

    // Buscar conversión inversa
    const inverseConversion = this.conversions.find(c => 
      c.from === normalizedTo && 
      c.to === normalizedFrom &&
      (!c.ingredientPattern || c.ingredientPattern.test(ingredientName))
    );

    if (inverseConversion) {
      return quantity / inverseConversion.factor;
    }

    return null; // No se puede convertir
  }

  /**
   * Obtiene la unidad base preferida para un ingrediente
   */
  getPreferredUnit(ingredientName: string, units: string[]): string {
    const normalizedName = ingredientName.toLowerCase();
    
    // Para ingredientes sólidos, preferir gramos
    if (units.includes('g') || units.includes('kg')) {
      return 'g';
    }
    
    // Para líquidos, preferir ml
    if (units.includes('ml') || units.includes('l') || units.includes('taza') || units.includes('cda') || units.includes('cdta')) {
      return 'ml';
    }
    
    // Para ingredientes que se cuentan por unidad, mantener unidad
    if (units.includes('unidad') || units.includes('pieza')) {
      // Si hay conversión disponible a gramos, usar gramos
      const hasWeightConversion = this.conversions.some(c => 
        (c.from === 'unidad' || c.from === 'pieza') && 
        c.to === 'g' &&
        c.ingredientPattern?.test(normalizedName)
      );
      
      if (hasWeightConversion && (units.includes('g') || units.some(u => this.canConvertTo(u, 'g', normalizedName)))) {
        return 'g';
      }
      
      return 'unidad';
    }
    
    // Por defecto, usar la primera unidad
    return units[0];
  }

  /**
   * Verifica si se puede convertir de una unidad a otra
   */
  canConvertTo(fromUnit: string, toUnit: string, ingredientName: string): boolean {
    return this.convert(1, fromUnit, toUnit, ingredientName) !== null;
  }

  /**
   * Normaliza el nombre de un ingrediente eliminando preparaciones específicas
   */
  normalizeIngredientName(ingredientName: string): string {
    const trimmed = ingredientName.trim();
    
    // Buscar coincidencia con patrones de normalización
    for (const norm of this.ingredientNormalizations) {
      if (norm.pattern.test(trimmed)) {
        return norm.baseName;
      }
    }
    
    // Si no hay coincidencia, devolver el nombre original limpio
    return trimmed.toLowerCase();
  }

  /**
   * Obtiene el mejor nombre para mostrar de una lista de variaciones del mismo ingrediente
   */
  getBestDisplayName(ingredientNames: string[]): string {
    if (ingredientNames.length === 0) return '';
    if (ingredientNames.length === 1) return ingredientNames[0];
    
    // Preferir nombres más simples (sin preparación específica)
    const sortedBySimplicity = ingredientNames.sort((a, b) => {
      // Contar palabras - nombres más simples tienen menos palabras
      const wordsA = a.trim().split(/\s+/).length;
      const wordsB = b.trim().split(/\s+/).length;
      
      if (wordsA !== wordsB) {
        return wordsA - wordsB; // Menos palabras primero
      }
      
      // Si tienen el mismo número de palabras, preferir el más corto
      return a.length - b.length;
    });
    
    return sortedBySimplicity[0];
  }

  private normalizeUnit(unit: string): string {
    if (!unit) return '';
    
    const normalized = unit.toLowerCase().trim();
    
    // Normalizar variaciones comunes
    const unitMappings: Record<string, string> = {
      'gramo': 'g',
      'gramos': 'g',
      'kilogramo': 'kg',
      'kilogramos': 'kg',
      'mililitro': 'ml',
      'mililitros': 'ml',
      'litros': 'l',
      'cucharada': 'cda',
      'cucharadas': 'cda',
      'cucharadita': 'cdta',
      'cucharaditas': 'cdta',
      'unidades': 'unidad',
      'piezas': 'pieza',
      'tazas': 'taza',
    };
    
    return unitMappings[normalized] || normalized;
  }
}