import { Inject, Injectable } from '@nestjs/common';
import { TAXONOMY_REPO, TaxonomyRepoPort } from '../ports/out.taxonomy-repo.port';

@Injectable()
export class ListTaxonomiesUseCase {
  constructor(@Inject(TAXONOMY_REPO) private readonly repo: TaxonomyRepoPort) {}
  execute() {
    return Promise.all([
      this.repo.listAllergies(),
      this.repo.listConditions(),
      this.repo.listCuisines(),
    ]).then(([allergies, conditions, cuisines]) => ({ allergies, conditions, cuisines }));
  }
}
