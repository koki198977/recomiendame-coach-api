import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PLAN_REPOSITORY, PlanRepositoryPort } from '../ports/out.plan-repository.port';
import { UnitConverterService } from '../services/unit-converter.service';

type Item = { name: string; unit?: string; qty?: number; category?: string };

// Helpers
const normalize = (s?: string) => (s ?? '').trim().toLowerCase();

@Injectable()
export class GenerateShoppingListUseCase {
  constructor(
    @Inject(PLAN_REPOSITORY) private readonly plans: PlanRepositoryPort,
    private readonly unitConverter: UnitConverterService,
  ) {}

  async execute(planId: string, opts?: { take?: number; cursor?: string }) {
    const take = Math.min(Math.max(opts?.take ?? 100, 1), 500); // [1..500]
    const cursor = opts?.cursor ? Number(Buffer.from(opts.cursor, 'base64').toString('utf8')) : 0;

    const plan = await this.plans.findById(planId);
    if (!plan) throw new NotFoundException('Plan no encontrado');

    // Paso 1: Recopilar todos los ingredientes por nombre
    const ingredientGroups = new Map<string, Array<{ name: string; unit?: string; qty: number; category?: string }>>();
    
    for (const day of plan.days) {
      for (const meal of day.meals) {
        for (const ing of meal.ingredients ?? []) {
          const normalizedName = normalize(ing.name);
          if (!ingredientGroups.has(normalizedName)) {
            ingredientGroups.set(normalizedName, []);
          }
          ingredientGroups.get(normalizedName)!.push({
            name: ing.name,
            unit: ing.unit,
            qty: Number(ing.qty ?? 0),
            category: ing.category,
          });
        }
      }
    }

    // Paso 2: Consolidar cada grupo de ingredientes con conversión de unidades
    const consolidatedItems: Array<Item & { qty: number }> = [];
    
    for (const [normalizedName, ingredients] of ingredientGroups) {
      // Obtener todas las unidades únicas para este ingrediente
      const units = [...new Set(ingredients.map(i => i.unit).filter(Boolean))] as string[];
      
      if (units.length <= 1) {
        // Solo una unidad o sin unidad, agregar directamente
        const totalQty = ingredients.reduce((sum, ing) => sum + ing.qty, 0);
        const bestIngredient = ingredients.reduce((best, current) => 
          current.name.length > best.name.length ? current : best
        );
        
        consolidatedItems.push({
          name: bestIngredient.name,
          unit: bestIngredient.unit,
          qty: totalQty,
          category: ingredients.find(i => i.category)?.category,
        });
      } else {
        // Múltiples unidades, intentar convertir
        const preferredUnit = this.unitConverter.getPreferredUnit(normalizedName, units);
        let totalQty = 0;
        let hasConversions = false;
        
        for (const ing of ingredients) {
          if (!ing.unit || ing.unit === preferredUnit) {
            totalQty += ing.qty;
          } else {
            const converted = this.unitConverter.convert(ing.qty, ing.unit, preferredUnit, normalizedName);
            if (converted !== null) {
              totalQty += converted;
              hasConversions = true;
            } else {
              // No se puede convertir, crear entrada separada
              const bestIngredient = ingredients.find(i => i.unit === ing.unit) || ing;
              consolidatedItems.push({
                name: bestIngredient.name,
                unit: ing.unit,
                qty: ing.qty,
                category: ing.category,
              });
            }
          }
        }
        
        if (totalQty > 0) {
          const bestIngredient = ingredients.reduce((best, current) => 
            current.name.length > best.name.length ? current : best
          );
          
          consolidatedItems.push({
            name: bestIngredient.name,
            unit: preferredUnit,
            qty: totalQty,
            category: ingredients.find(i => i.category)?.category,
          });
        }
      }
    }

    // Paso 3: Filtrar, formatear y ordenar
    const itemsAll = consolidatedItems
      .filter(i => i.qty > 0) // Solo incluimos items con cantidad > 0
      .map(i => ({
        name: i.name,
        unit: i.unit,
        qty: Math.round(i.qty * 100) / 100, // Redondeamos a 2 decimales
        category: i.category ?? undefined,
      }))
      .sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '')
                      || a.name.localeCompare(b.name)
                      || (a.unit ?? '').localeCompare(b.unit ?? ''));

    // Paginación por índice
    const slice = itemsAll.slice(cursor, cursor + take);
    const nextIndex = cursor + slice.length;
    const nextCursor = nextIndex < itemsAll.length ? Buffer.from(String(nextIndex), 'utf8').toString('base64') : null;

    return {
      planId,
      items: slice,
      nextCursor,
      total: itemsAll.length,
    };
  }

  toCSV(rows: Item[]): string {
    // Encabezados
    const headers = ['name','qty','unit','category'];
    const esc = (v?: string | number) => {
      const s = v == null ? '' : String(v);
      // escapado CSV básico
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const lines = [headers.join(',')];
    for (const r of rows) {
      lines.push([esc(r.name), esc(r.qty ?? ''), esc(r.unit ?? ''), esc(r.category ?? '')].join(','));
    }
    // BOM para Excel + UTF-8
    return '\uFEFF' + lines.join('\n');
  }
}
