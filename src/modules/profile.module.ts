import { Module } from '@nestjs/common';
import { MeProfileController } from '../infrastructure/http/me.profile.controller';
import { TaxonomiesController } from '../infrastructure/http/taxonomies.controller';

import { GetMyProfileUseCase } from '../core/application/profile/use-cases/get-my-profile.usecase';
import { UpdateMyProfileUseCase } from '../core/application/profile/use-cases/update-my-profile.usecase';
import { UpdateMyPreferencesUseCase } from '../core/application/profile/use-cases/update-my-preferences.usecase';
import { ListTaxonomiesUseCase } from '../core/application/profile/use-cases/list-taxonomies.usecase'; // 👈

import { PROFILE_REPO } from '../core/application/profile/ports/out.profile-repo.port';
import { TAXONOMY_REPO } from '../core/application/profile/ports/out.taxonomy-repo.port';
import { ProfilePrismaRepository } from '../infrastructure/persistence/prisma/profile.prisma.repository';
import { TaxonomyPrismaRepository } from '../infrastructure/persistence/prisma/taxonomy.prisma.repository';
import { PrismaModule } from 'src/infrastructure/database/prisma.module';


@Module({
  imports: [PrismaModule],
  controllers: [MeProfileController, TaxonomiesController],
  providers: [
    GetMyProfileUseCase,
    UpdateMyProfileUseCase,
    UpdateMyPreferencesUseCase,
    ListTaxonomiesUseCase,
    { provide: PROFILE_REPO, useClass: ProfilePrismaRepository },
    { provide: TAXONOMY_REPO, useClass: TaxonomyPrismaRepository },
  ],
})
export class ProfileModule {}
