import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  AdminCatalogRepositoryPort,
  AdminAllergy,
  AdminHealthCondition,
  AdminCuisine,
} from '../../../core/application/admin/ports/out.admin-catalog-repository.port';

@Injectable()
export class AdminCatalogPrismaRepository implements AdminCatalogRepositoryPort {
  constructor(private prisma: PrismaService) {}

  async listAllergies(): Promise<AdminAllergy[]> {
    const items = await this.prisma.allergy.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { name: 'asc' },
    });
    return items.map((a) => ({ id: a.id, name: a.name, userCount: a._count.users }));
  }

  async listHealthConditions(): Promise<AdminHealthCondition[]> {
    const items = await this.prisma.healthCondition.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { label: 'asc' },
    });
    return items.map((c) => ({ id: c.id, code: c.code, label: c.label, userCount: c._count.users }));
  }

  async listCuisines(): Promise<AdminCuisine[]> {
    const items = await this.prisma.cuisine.findMany({
      include: { prefs: { select: { kind: true } } },
      orderBy: { name: 'asc' },
    });
    return items.map((c) => ({
      id: c.id,
      name: c.name,
      likeCount: c.prefs.filter((p) => p.kind === 'LIKE').length,
      dislikeCount: c.prefs.filter((p) => p.kind === 'DISLIKE').length,
    }));
  }

  async createAllergy(name: string): Promise<AdminAllergy> {
    const a = await this.prisma.allergy.create({ data: { name } });
    return { id: a.id, name: a.name, userCount: 0 };
  }

  async updateAllergy(id: number, name: string): Promise<AdminAllergy> {
    const a = await this.prisma.allergy.update({
      where: { id },
      data: { name },
      include: { _count: { select: { users: true } } },
    });
    return { id: a.id, name: a.name, userCount: a._count.users };
  }

  async deleteAllergy(id: number): Promise<void> {
    await this.prisma.allergy.delete({ where: { id } });
  }

  async createHealthCondition(code: string, label: string): Promise<AdminHealthCondition> {
    const c = await this.prisma.healthCondition.create({ data: { code, label } });
    return { id: c.id, code: c.code, label: c.label, userCount: 0 };
  }

  async updateHealthCondition(id: number, data: { code?: string; label?: string }): Promise<AdminHealthCondition> {
    const c = await this.prisma.healthCondition.update({
      where: { id },
      data,
      include: { _count: { select: { users: true } } },
    });
    return { id: c.id, code: c.code, label: c.label, userCount: c._count.users };
  }

  async deleteHealthCondition(id: number): Promise<void> {
    await this.prisma.healthCondition.delete({ where: { id } });
  }

  async createCuisine(name: string): Promise<AdminCuisine> {
    const c = await this.prisma.cuisine.create({ data: { name } });
    return { id: c.id, name: c.name, likeCount: 0, dislikeCount: 0 };
  }

  async updateCuisine(id: number, name: string): Promise<AdminCuisine> {
    const c = await this.prisma.cuisine.update({
      where: { id },
      data: { name },
      include: { prefs: { select: { kind: true } } },
    });
    return {
      id: c.id,
      name: c.name,
      likeCount: c.prefs.filter((p) => p.kind === 'LIKE').length,
      dislikeCount: c.prefs.filter((p) => p.kind === 'DISLIKE').length,
    };
  }

  async deleteCuisine(id: number): Promise<void> {
    await this.prisma.cuisine.delete({ where: { id } });
  }
}
