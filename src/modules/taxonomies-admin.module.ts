import { Module } from '@nestjs/common';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { TaxonomiesAdminController } from '../infrastructure/http/taxonomies.admin.controller';
import { TaxonomiesPrismaRepository } from '../infrastructure/persistence/prisma/taxonomies.prisma.repository';
import { TAXONOMIES_ADMIN_REPO } from '../core/application/taxonomies/ports/out.taxonomies-admin-repo.port';

import { ListAllergiesUC, CreateAllergyUC, UpdateAllergyUC, DeleteAllergyUC } from '../core/application/taxonomies/use-cases/admin-allergies.usecases';
import { ListConditionsUC, CreateConditionUC, UpdateConditionUC, DeleteConditionUC } from '../core/application/taxonomies/use-cases/admin-conditions.usecases';
import { ListCuisinesUC, CreateCuisineUC, UpdateCuisineUC, DeleteCuisineUC } from '../core/application/taxonomies/use-cases/admin-cuisines.usecases';

@Module({
  imports: [PrismaModule],
  controllers: [TaxonomiesAdminController],
  providers: [
    { provide: TAXONOMIES_ADMIN_REPO, useClass: TaxonomiesPrismaRepository },
    // Use cases
    ListAllergiesUC, CreateAllergyUC, UpdateAllergyUC, DeleteAllergyUC,
    ListConditionsUC, CreateConditionUC, UpdateConditionUC, DeleteConditionUC,
    ListCuisinesUC, CreateCuisineUC, UpdateCuisineUC, DeleteCuisineUC,
  ],
})
export class TaxonomiesAdminModule {}
