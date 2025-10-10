import { Module } from '@nestjs/common';
import { TaxonomiesController } from '../infrastructure/http/taxonomies.controller';
import { TaxonomiesPrismaRepository } from '../infrastructure/persistence/prisma/taxonomies.prisma.repository';
import { PrismaModule } from 'src/infrastructure/database/prisma.module';

import { TAXONOMY_REPO } from '../core/application/profile/ports/out.taxonomy-repo.port';


@Module({
  imports: [PrismaModule],  
  controllers: [TaxonomiesController],
  providers: [
    TaxonomiesPrismaRepository,
    { provide: TAXONOMY_REPO, useExisting: TaxonomiesPrismaRepository },
],
  exports: [TAXONOMY_REPO],
})
export class TaxonomiesModule {}
