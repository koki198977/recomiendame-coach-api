import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PLAN_REPOSITORY, PlanRepositoryPort } from '../ports/out.plan-repository.port';

type Item = { name: string; unit?: string; qty?: number; category?: string };

// Helpers
const normalize = (s?: string) => (s ?? '').trim().toLowerCase();
const keyOf = (name: string, unit?: string) => `${normalize(name)}__${normalize(unit)}`;

@Injectable()
export class GenerateShoppingListUseCase {
  constructor(@Inject(PLAN_REPOSITORY) private readonly plans: PlanRepositoryPort) {}

  async execute(planId: string, opts?: { take?: number; cursor?: string }) {
    const take = Math.min(Math.max(opts?.take ?? 100, 1), 500); // [1..500]
    const cursor = opts?.cursor ? Number(Buffer.from(opts.cursor, 'base64').toString('utf8')) : 0;

    const plan = await this.plans.findById(planId);
    if (!plan) throw new NotFoundException('Plan no encontrado');

    // Aggregate
    const bucket = new Map<string, Item & { qty: number }>();
    for (const day of plan.days) {
      for (const meal of day.meals) {
        for (const ing of meal.ingredients ?? []) {
          const k = keyOf(ing.name, ing.unit);
          if (!bucket.has(k)) {
            bucket.set(k, { name: normalize(ing.name), unit: normalize(ing.unit) || undefined, qty: 0, category: ing.category ?? undefined });
          }
          const row = bucket.get(k)!;
          row.qty += Number(ing.qty ?? 0);
          if (!row.category && ing.category) row.category = ing.category;
        }
      }
    }

    // Orden estable
    const itemsAll = Array.from(bucket.values())
      .map(i => ({
        name: i.name.replace(/\b\w/g, c => c.toUpperCase()),
        unit: i.unit,
        qty: i.qty || undefined,
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
