export interface TaxonomyRepoPort {
  listAllergies(): Promise<{ id: number; name: string }[]>;
  listConditions(): Promise<{ id: number; code: string; label: string }[]>;
  listCuisines(): Promise<{ id: number; name: string }[]>;
}
export const TAXONOMY_REPO = Symbol('TAXONOMY_REPO');
