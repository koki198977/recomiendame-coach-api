import {
  Controller,
  Get,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminListUsersUseCase } from '../../core/application/admin/use-cases/admin-list-users.usecase';
import { AdminGetUserDetailUseCase } from '../../core/application/admin/use-cases/admin-get-user-detail.usecase';
import { AdminDeleteUserUseCase } from '../../core/application/admin/use-cases/admin-delete-user.usecase';
import { AdminChangeRoleUseCase } from '../../core/application/admin/use-cases/admin-change-role.usecase';
import { AdminListPaymentsUseCase } from '../../core/application/admin/use-cases/admin-list-payments.usecase';
import { AdminGetUserUsageUseCase } from '../../core/application/admin/use-cases/admin-get-user-usage.usecase';
import { AdminGetUsageSummaryUseCase } from '../../core/application/admin/use-cases/admin-get-usage-summary.usecase';
import { AdminGetMetricsUseCase } from '../../core/application/admin/use-cases/admin-get-metrics.usecase';
import { AdminGetUserPlansUseCase } from '../../core/application/admin/use-cases/admin-get-user-plans.usecase';
import { AdminGetUserCheckinsUseCase } from '../../core/application/admin/use-cases/admin-get-user-checkins.usecase';
import { ListUsersAdminDto } from '../../core/application/admin/dto/list-users-admin.dto';
import { ListPaymentsAdminDto } from '../../core/application/admin/dto/list-payments-admin.dto';
import { ChangeRoleDto } from '../../core/application/admin/dto/change-role.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AdminController {
  constructor(
    private readonly listUsersUseCase: AdminListUsersUseCase,
    private readonly getUserDetailUseCase: AdminGetUserDetailUseCase,
    private readonly deleteUserUseCase: AdminDeleteUserUseCase,
    private readonly changeRoleUseCase: AdminChangeRoleUseCase,
    private readonly listPaymentsUseCase: AdminListPaymentsUseCase,
    private readonly getUserUsageUseCase: AdminGetUserUsageUseCase,
    private readonly getUsageSummaryUseCase: AdminGetUsageSummaryUseCase,
    private readonly getMetricsUseCase: AdminGetMetricsUseCase,
    private readonly getUserPlansUseCase: AdminGetUserPlansUseCase,
    private readonly getUserCheckinsUseCase: AdminGetUserCheckinsUseCase,
  ) {}

  @Get('users')
  listUsers(@Query() dto: ListUsersAdminDto) {
    return this.listUsersUseCase.execute(dto);
  }

  @Get('usage/summary')
  getUsageSummary() {
    return this.getUsageSummaryUseCase.execute();
  }

  @Get('metrics')
  getMetrics() {
    return this.getMetricsUseCase.execute();
  }

  @Get('payments')
  listPayments(@Query() dto: ListPaymentsAdminDto) {
    return this.listPaymentsUseCase.execute(dto);
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.getUserDetailUseCase.execute(id);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string, @Request() req: any) {
    return this.deleteUserUseCase.execute(id, req.user.id);
  }

  @Patch('users/:id/role')
  changeRole(@Param('id') id: string, @Body() dto: ChangeRoleDto) {
    return this.changeRoleUseCase.execute(id, dto.role);
  }

  @Get('users/:id/usage')
  getUserUsage(@Param('id') id: string) {
    return this.getUserUsageUseCase.execute(id);
  }

  @Get('users/:id/plans')
  getUserPlans(@Param('id') id: string) {
    return this.getUserPlansUseCase.execute(id);
  }

  @Get('users/:id/checkins')
  getUserCheckins(@Param('id') id: string) {
    return this.getUserCheckinsUseCase.execute(id);
  }
}
