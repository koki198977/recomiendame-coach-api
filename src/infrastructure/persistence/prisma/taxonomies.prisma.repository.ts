import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  TaxonomiesAdminRepoPort, PageQuery, AllergyDto, ConditionDto, CuisineDto
} from '../../../core/application/taxonomies/ports/out.taxonomies-admin-repo.port';

@Injectable()
export class TaxonomiesPrismaRepository implements TaxonomiesAdminRepoPort {
  constructor(private prisma: PrismaService) {}

  // Allergies
  async listAllergies(q: PageQuery) {
    const where = q.search ? { name: { contains: q.search, mode: 'insensitive' as const } } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.allergy.findMany({ where, skip: q.skip ?? 0, take: q.take ?? 20, orderBy: { id: 'asc' } }),
      this.prisma.allergy.count({ where }),
    ]);
    return { items: items.map(a => ({ id: a.id, name: a.name })), total };
  }
  createAllergy(name: string) { return this.prisma.allergy.create({ data: { name } }); }
  updateAllergy(id: number, name: string) { return this.prisma.allergy.update({ where: { id }, data: { name } }); }
  async deleteAllergy(id: number) { await this.prisma.allergy.delete({ where: { id } }); }

  // Conditions
  async listConditions(q: PageQuery) {
    const where = q.search ? {
      OR: [
        { code: { contains: q.search, mode: 'insensitive' as const } },
        { label: { contains: q.search, mode: 'insensitive' as const } },
      ],
    } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.healthCondition.findMany({ where, skip: q.skip ?? 0, take: q.take ?? 20, orderBy: { id: 'asc' } }),
      this.prisma.healthCondition.count({ where }),
    ]);
    return { items: items.map(c => ({ id: c.id, code: c.code, label: c.label })), total };
  }
  createCondition(input: { code: string; label: string }) {
    return this.prisma.healthCondition.create({ data: { code: input.code, label: input.label } });
  }
  updateCondition(id: number, input: { code: string; label: string }) {
    return this.prisma.healthCondition.update({ where: { id }, data: { code: input.code, label: input.label } });
  }
  async deleteCondition(id: number) { await this.prisma.healthCondition.delete({ where: { id } }); }

  // Cuisines
  async listCuisines(q: PageQuery) {
    const where = q.search ? { name: { contains: q.search, mode: 'insensitive' as const } } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.cuisine.findMany({ where, skip: q.skip ?? 0, take: q.take ?? 20, orderBy: { id: 'asc' } }),
      this.prisma.cuisine.count({ where }),
    ]);
    return { items: items.map(c => ({ id: c.id, name: c.name })), total };
  }
  createCuisine(name: string) { return this.prisma.cuisine.create({ data: { name } }); }
  updateCuisine(id: number, name: string) { return this.prisma.cuisine.update({ where: { id }, data: { name } }); }
  async deleteCuisine(id: number) { await this.prisma.cuisine.delete({ where: { id } }); }
}
