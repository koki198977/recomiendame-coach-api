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
import { ADMIN_USER_REPOSITORY } from '../core/application/admin/ports/out.admin-user-repository.port';
import { ADMIN_PAYMENT_REPOSITORY } from '../core/application/admin/ports/out.admin-payment-repository.port';
import { ADMIN_USAGE_REPOSITORY } from '../core/application/admin/ports/out.admin-usage-repository.port';
import { AdminUserPrismaRepository } from '../infrastructure/persistence/prisma/admin-user.prisma.repository';
import { AdminPaymentPrismaRepository } from '../infrastructure/persistence/prisma/admin-payment.prisma.repository';
import { AdminUsagePrismaRepository } from '../infrastructure/persistence/prisma/admin-usage.prisma.repository';

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
    { provide: ADMIN_USER_REPOSITORY, useClass: AdminUserPrismaRepository },
    { provide: ADMIN_PAYMENT_REPOSITORY, useClass: AdminPaymentPrismaRepository },
    { provide: ADMIN_USAGE_REPOSITORY, useClass: AdminUsagePrismaRepository },
  ],
})
export class AdminModule {}
