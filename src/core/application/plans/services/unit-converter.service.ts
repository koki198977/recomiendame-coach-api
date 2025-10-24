import { Injectable } from '@nestjs/common';

interface ConversionRule {
  from: string;
  to: string;
  factor: number; // factor de conversión
  ingredientPattern?: RegExp; // patrón para ingredientes específicos
}

@Injectable()
export class UnitConverterService {
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