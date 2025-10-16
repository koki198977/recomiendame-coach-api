import { Inject, Injectable } from '@nestjs/common';
import { TAXONOMIES_ADMIN_REPO, TaxonomiesAdminRepoPort, PageQuery } from '../ports/out.taxonomies-admin-repo.port';

@Injectable()
export class ListConditionsUC {
  constructor(@Inject(TAXONOMIES_ADMIN_REPO) private repo: TaxonomiesAdminRepoPort) {}
  execute(q: PageQuery) { return this.repo.listConditions(q); }
}

@Injectable()
export class CreateConditionUC {
  constructor(@Inject(TAXONOMIES_ADMIN_REPO) private repo: TaxonomiesAdminRepoPort) {}
  execute(input: { code: string; label: string }) { return this.repo.createCondition(input); }
}

@Injectable()
export class UpdateConditionUC {
  constructor(@Inject(TAXONOMIES_ADMIN_REPO) private repo: TaxonomiesAdminRepoPort) {}
  execute(id: number, input: { code: string; label: string }) { return this.repo.updateCondition(id, input); }
}

@Injectable()
export class DeleteConditionUC {
  constructor(@Inject(TAXONOMIES_ADMIN_REPO) private repo: TaxonomiesAdminRepoPort) {}
  execute(id: number) { return this.repo.deleteCondition(id); }
}
