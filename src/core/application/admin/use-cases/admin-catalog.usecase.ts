import { Injectable, Inject } from '@nestjs/common';
import {
  AdminCatalogRepositoryPort,
  ADMIN_CATALOG_REPOSITORY,
} from '../ports/out.admin-catalog-repository.port';

@Injectable()
export class AdminCatalogUseCase {
  constructor(
    @Inject(ADMIN_CATALOG_REPOSITORY)
    private readonly repo: AdminCatalogRepositoryPort,
  ) {}

  listAllergies() { return this.repo.listAllergies(); }
  createAllergy(name: string) { return this.repo.createAllergy(name); }
  updateAllergy(id: number, name: string) { return this.repo.updateAllergy(id, name); }
  deleteAllergy(id: number) { return this.repo.deleteAllergy(id); }

  listHealthConditions() { return this.repo.listHealthConditions(); }
  createHealthCondition(code: string, label: string) { return this.repo.createHealthCondition(code, label); }
  updateHealthCondition(id: number, data: { code?: string; label?: string }) { return this.repo.updateHealthCondition(id, data); }
  deleteHealthCondition(id: number) { return this.repo.deleteHealthCondition(id); }

  listCuisines() { return this.repo.listCuisines(); }
  createCuisine(name: string) { return this.repo.createCuisine(name); }
  updateCuisine(id: number, name: string) { return this.repo.updateCuisine(id, name); }
  deleteCuisine(id: number) { return this.repo.deleteCuisine(id); }
}
