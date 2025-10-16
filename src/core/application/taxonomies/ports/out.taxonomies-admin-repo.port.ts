export interface PageQuery {
  search?: string;
  skip?: number;
  take?: number;
}

export interface AllergyDto { id: number; name: string }
export interface ConditionDto { id: number; code: string; label: string }
export interface CuisineDto { id: number; name: string }

export interface TaxonomiesAdminRepoPort {
  // Allergies
  listAllergies(q: PageQuery): Promise<{ items: AllergyDto[]; total: number }>;
  createAllergy(name: string): Promise<AllergyDto>;
  updateAllergy(id: number, name: string): Promise<AllergyDto>;
  deleteAllergy(id: number): Promise<void>;

  // Conditions
  listConditions(q: PageQuery): Promise<{ items: ConditionDto[]; total: number }>;
  createCondition(input: { code: string; label: string }): Promise<ConditionDto>;
  updateCondition(id: number, input: { code: string; label: string }): Promise<ConditionDto>;
  deleteCondition(id: number): Promise<void>;

  // Cuisines
  listCuisines(q: PageQuery): Promise<{ items: CuisineDto[]; total: number }>;
  createCuisine(name: string): Promise<CuisineDto>;
  updateCuisine(id: number, name: string): Promise<CuisineDto>;
  deleteCuisine(id: number): Promise<void>;
}

export const TAXONOMIES_ADMIN_REPO = Symbol('TAXONOMIES_ADMIN_REPO');
