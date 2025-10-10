import { DomainError } from '../common/domain.error';

export class Week {
  private constructor(public readonly start: Date) {}
  static fromISOWeek(iso: string): Week {
    // YYYY-Www
    const m = iso.match(/^(\d{4})-W(\d{2})$/);
    if (!m) throw new DomainError(`Semana inválida: ${iso}`);
    const [_, y, w] = m;
    const year = +y;
    const week = +w;
    // Algoritmo simple: tomar el jueves de la semana ISO
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const dayOfWeek = (jan4.getUTCDay() + 6) % 7; // 0=lun
    const week1Monday = new Date(jan4);
    week1Monday.setUTCDate(jan4.getUTCDate() - dayOfWeek);
    const monday = new Date(week1Monday);
    monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
    return new Week(monday);
  }
}

export class Macros {
  constructor(
    public protein_g: number,
    public carbs_g: number,
    public fat_g: number,
    public kcalTarget: number,
  ) {}
}
