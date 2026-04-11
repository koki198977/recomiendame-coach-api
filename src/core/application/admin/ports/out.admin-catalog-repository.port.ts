export interface AdminAllergy {
  id: number;
  name: string;
  userCount: number;
}

export interface AdminHealthCondition {
  id: number;
  code: string;
  label: string;
  userCount: number;
}

export interface AdminCuisine {
  id: number;
  name: string;
  likeCount: number;
  dislikeCount: number;
}

export interface AdminCatalogRepositoryPort {
  listAllergies(): Promise<AdminAllergy[]>;
  listHealthConditions(): Promise<AdminHealthCondition[]>;
  listCuisines(): Promise<AdminCuisine[]>;

  createAllergy(name: string): Promise<AdminAllergy>;
  updateAllergy(id: number, name: string): Promise<AdminAllergy>;
  deleteAllergy(id: number): Promise<void>;

  createHealthCondition(code: string, label: string): Promise<AdminHealthCondition>;
  updateHealthCondition(id: number, data: { code?: string; label?: string }): Promise<AdminHealthCondition>;
  deleteHealthCondition(id: number): Promise<void>;

  createCuisine(name: string): Promise<AdminCuisine>;
  updateCuisine(id: number, name: string): Promise<AdminCuisine>;
  deleteCuisine(id: number): Promise<void>;
}

export const ADMIN_CATALOG_REPOSITORY = Symbol('ADMIN_CATALOG_REPOSITORY');
