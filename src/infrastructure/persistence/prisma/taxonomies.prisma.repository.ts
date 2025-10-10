import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/database/prisma.service';

@Injectable()
export class TaxonomiesPrismaRepository {
  constructor(private prisma: PrismaService) {}

  // ---------- Allergies ----------
  async listAllergies(params: { search?: string; skip?: number; take?: number }) {
    const { search, skip = 0, take = 20 } = params;
    const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};
    const [items, total] = await Promise.all([
      this.prisma.allergy.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      this.prisma.allergy.count({ where }),
    ]);
    return { items, total };
  }
  createAllergy(name: string) { return this.prisma.allergy.create({ data: { name } }); }
  updateAllergy(id: number, name: string) { return this.prisma.allergy.update({ where: { id }, data: { name } }); }
  deleteAllergy(id: number) { return this.prisma.allergy.delete({ where: { id } }); }

  // ---------- Health Conditions ----------
  async listConditions(params: { search?: string; skip?: number; take?: number }) {
    const { search, skip = 0, take = 20 } = params;
    const where = search
      ? { OR: [{ code: { contains: search, mode: 'insensitive' as const } }, { label: { contains: search, mode: 'insensitive' as const } }] }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.healthCondition.findMany({ where, skip, take, orderBy: [{ code: 'asc' }, { label: 'asc' }] }),
      this.prisma.healthCondition.count({ where }),
    ]);
    return { items, total };
  }
  createCondition(input: { code: string; label: string }) { return this.prisma.healthCondition.create({ data: input }); }
  updateCondition(id: number, input: { code?: string; label?: string }) { return this.prisma.healthCondition.update({ where: { id }, data: input }); }
  deleteCondition(id: number) { return this.prisma.healthCondition.delete({ where: { id } }); }

  // ---------- Cuisines ----------
  async listCuisines(params: { search?: string; skip?: number; take?: number }) {
    const { search, skip = 0, take = 20 } = params;
    const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};
    const [items, total] = await Promise.all([
      this.prisma.cuisine.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      this.prisma.cuisine.count({ where }),
    ]);
    return { items, total };
  }
  createCuisine(name: string) { return this.prisma.cuisine.create({ data: { name } }); }
  updateCuisine(id: number, name: string) { return this.prisma.cuisine.update({ where: { id }, data: { name } }); }
  deleteCuisine(id: number) { return this.prisma.cuisine.delete({ where: { id } }); }
}
