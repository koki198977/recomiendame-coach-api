import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TAXONOMY_REPO, TaxonomyRepoPort } from '../../../core/application/profile/ports/out.taxonomy-repo.port';

@Injectable()
export class TaxonomyPrismaRepository implements TaxonomyRepoPort {
  constructor(private prisma: PrismaService) {}
  listAllergies()  { return this.prisma.allergy.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }); }
  listConditions() { return this.prisma.healthCondition.findMany({ select: { id: true, code: true, label: true }, orderBy: { label: 'asc' } }); }
  listCuisines()   { return this.prisma.cuisine.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }); }
}
