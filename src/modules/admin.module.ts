import { Module } from '@nestjs/common';
import { AdminController } from '../infrastructure/http/admin.controller';
import { AdminListUsersUseCase } from '../core/application/admin/use-cases/admin-list-users.usecase';
import { AdminGetUserDetailUseCase } from '../core/application/admin/use-cases/admin-get-user-detail.usecase';
import { AdminDeleteUserUseCase } from '../core/application/admin/use-cases/admin-delete-user.usecase';
import { AdminChangeRoleUseCase } from '../core/application/admin/use-cases/admin-change-role.usecase';
import { AdminListPaymentsUseCase } from '../core/application/admin/use-cases/admin-list-payments.usecase';
import { AdminGetUserUsageUseCase } from '../core/application/admin/use-cases/admin-get-user-usage.usecase';
import { AdminGetUsageSummaryUseCase } from '../core/application/admin/use-cases/admin-get-usage-summary.usecase';
import { AdminGetMetricsUseCase } from '../core/application/admin/use-cases/admin-get-metrics.usecase';
import { AdminGetUserPlansUseCase } from '../core/application/admin/use-cases/admin-get-user-plans.usecase';
import { AdminGetUserCheckinsUseCase } from '../core/application/admin/use-cases/admin-get-user-checkins.usecase';
import { AdminCatalogUseCase } from '../core/application/admin/use-cases/admin-catalog.usecase';
import { AdminContentUseCase } from '../core/application/admin/use-cases/admin-content.usecase';
import { AdminGetStatsUseCase } from '../core/application/admin/use-cases/admin-get-stats.usecase';
import { ADMIN_USER_REPOSITORY } from '../core/application/admin/ports/out.admin-user-repository.port';
import { ADMIN_PAYMENT_REPOSITORY } from '../core/application/admin/ports/out.admin-payment-repository.port';
import { ADMIN_USAGE_REPOSITORY } from '../core/application/admin/ports/out.admin-usage-repository.port';
import { ADMIN_CATALOG_REPOSITORY } from '../core/application/admin/ports/out.admin-catalog-repository.port';
import { ADMIN_STATS_REPOSITORY } from '../core/application/admin/ports/out.admin-stats-repository.port';
import { ADMIN_CONTENT_REPOSITORY } from '../core/application/admin/ports/out.admin-content-repository.port';
import { AdminUserPrismaRepository } from '../infrastructure/persistence/prisma/admin-user.prisma.repository';
import { AdminPaymentPrismaRepository } from '../infrastructure/persistence/prisma/admin-payment.prisma.repository';
import { AdminUsagePrismaRepository } from '../infrastructure/persistence/prisma/admin-usage.prisma.repository';
import { AdminCatalogPrismaRepository } from '../infrastructure/persistence/prisma/admin-catalog.prisma.repository';
import { AdminStatsPrismaRepository } from '../infrastructure/persistence/prisma/admin-stats.prisma.repository';
import { AdminContentPrismaRepository } from '../infrastructure/persistence/prisma/admin-content.prisma.repository';

@Module({
  controllers: [AdminController],
  providers: [
    AdminListUsersUseCase,
    AdminGetUserDetailUseCase,
    AdminDeleteUserUseCase,
    AdminChangeRoleUseCase,
    AdminListPaymentsUseCase,
    AdminGetUserUsageUseCase,
    AdminGetUsageSummaryUseCase,
    AdminGetMetricsUseCase,
    AdminGetUserPlansUseCase,
    AdminGetUserCheckinsUseCase,
    AdminCatalogUseCase,
    AdminContentUseCase,
    AdminGetStatsUseCase,
    { provide: ADMIN_USER_REPOSITORY, useClass: AdminUserPrismaRepository },
    { provide: ADMIN_PAYMENT_REPOSITORY, useClass: AdminPaymentPrismaRepository },
    { provide: ADMIN_USAGE_REPOSITORY, useClass: AdminUsagePrismaRepository },
    { provide: ADMIN_CATALOG_REPOSITORY, useClass: AdminCatalogPrismaRepository },
    { provide: ADMIN_STATS_REPOSITORY, useClass: AdminStatsPrismaRepository },
    { provide: ADMIN_CONTENT_REPOSITORY, useClass: AdminContentPrismaRepository },
  ],
})
export class AdminModule {}
