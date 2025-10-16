import { Inject, Injectable } from '@nestjs/common';
import { TAXONOMIES_ADMIN_REPO, TaxonomiesAdminRepoPort, PageQuery } from '../ports/out.taxonomies-admin-repo.port';

@Injectable()
export class ListCuisinesUC {
  constructor(@Inject(TAXONOMIES_ADMIN_REPO) private repo: TaxonomiesAdminRepoPort) {}
  execute(q: PageQuery) { return this.repo.listCuisines(q); }
}
@Injectable()
export class CreateCuisineUC {
  constructor(@Inject(TAXONOMIES_ADMIN_REPO) private repo: TaxonomiesAdminRepoPort) {}
  execute(name: string) { return this.repo.createCuisine(name); }
}
@Injectable()
export class UpdateCuisineUC {
  constructor(@Inject(TAXONOMIES_ADMIN_REPO) private repo: TaxonomiesAdminRepoPort) {}
  execute(id: number, name: string) { return this.repo.updateCuisine(id, name); }
}
@Injectable()
export class DeleteCuisineUC {
  constructor(@Inject(TAXONOMIES_ADMIN_REPO) private repo: TaxonomiesAdminRepoPort) {}
  execute(id: number) { return this.repo.deleteCuisine(id); }
}
