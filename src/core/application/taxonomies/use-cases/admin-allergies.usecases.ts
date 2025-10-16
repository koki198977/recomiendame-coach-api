import { Inject, Injectable } from '@nestjs/common';
import { TAXONOMIES_ADMIN_REPO, TaxonomiesAdminRepoPort, PageQuery } from '../ports/out.taxonomies-admin-repo.port';

@Injectable()
export class ListAllergiesUC {
  constructor(@Inject(TAXONOMIES_ADMIN_REPO) private repo: TaxonomiesAdminRepoPort) {}
  execute(q: PageQuery) { return this.repo.listAllergies(q); }
}
@Injectable()
export class CreateAllergyUC {
  constructor(@Inject(TAXONOMIES_ADMIN_REPO) private repo: TaxonomiesAdminRepoPort) {}
  execute(name: string) { return this.repo.createAllergy(name); }
}
@Injectable()
export class UpdateAllergyUC {
  constructor(@Inject(TAXONOMIES_ADMIN_REPO) private repo: TaxonomiesAdminRepoPort) {}
  execute(id: number, name: string) { return this.repo.updateAllergy(id, name); }
}
@Injectable()
export class DeleteAllergyUC {
  constructor(@Inject(TAXONOMIES_ADMIN_REPO) private repo: TaxonomiesAdminRepoPort) {}
  execute(id: number) { return this.repo.deleteAllergy(id); }
}
