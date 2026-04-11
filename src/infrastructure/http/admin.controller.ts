import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
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
import { AdminCatalogUseCase } from '../../core/application/admin/use-cases/admin-catalog.usecase';
import { AdminContentUseCase } from '../../core/application/admin/use-cases/admin-content.usecase';
import { AdminGetStatsUseCase } from '../../core/application/admin/use-cases/admin-get-stats.usecase';
import { ListUsersAdminDto } from '../../core/application/admin/dto/list-users-admin.dto';
import { ListPaymentsAdminDto } from '../../core/application/admin/dto/list-payments-admin.dto';
import { ChangeRoleDto } from '../../core/application/admin/dto/change-role.dto';
import { ListNutritionProductsDto } from '../../core/application/admin/dto/list-nutrition-products.dto';
import { ListPostsAdminDto } from '../../core/application/admin/dto/list-posts-admin.dto';
import {
  CreateAllergyDto, UpdateAllergyDto,
  CreateHealthConditionDto, UpdateHealthConditionDto,
  CreateCuisineDto, UpdateCuisineDto,
} from '../../core/application/admin/dto/catalog.dto';

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
    private readonly catalogUseCase: AdminCatalogUseCase,
    private readonly contentUseCase: AdminContentUseCase,
    private readonly statsUseCase: AdminGetStatsUseCase,
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

  // ── Stats / Preferences ──────────────────────────────────────────────────

  @Get('stats/preferences')
  getPreferenceStats() {
    return this.statsUseCase.executePreferences();
  }

  @Get('metrics/extended')
  getExtendedMetrics() {
    return this.statsUseCase.executeExtendedMetrics();
  }

  @Get('users/:id/extra')
  getUserExtra(@Param('id') id: string) {
    return this.statsUseCase.executeUserExtra(id);
  }

  // ── Catalog — Allergies ──────────────────────────────────────────────────

  @Get('catalog/allergies')
  listAllergies() {
    return this.catalogUseCase.listAllergies();
  }

  @Post('catalog/allergies')
  createAllergy(@Body() dto: CreateAllergyDto) {
    return this.catalogUseCase.createAllergy(dto.name);
  }

  @Patch('catalog/allergies/:id')
  updateAllergy(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAllergyDto) {
    return this.catalogUseCase.updateAllergy(id, dto.name);
  }

  @Delete('catalog/allergies/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAllergy(@Param('id', ParseIntPipe) id: number) {
    return this.catalogUseCase.deleteAllergy(id);
  }

  // ── Catalog — Health Conditions ──────────────────────────────────────────

  @Get('catalog/health-conditions')
  listHealthConditions() {
    return this.catalogUseCase.listHealthConditions();
  }

  @Post('catalog/health-conditions')
  createHealthCondition(@Body() dto: CreateHealthConditionDto) {
    return this.catalogUseCase.createHealthCondition(dto.code, dto.label);
  }

  @Patch('catalog/health-conditions/:id')
  updateHealthCondition(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHealthConditionDto) {
    return this.catalogUseCase.updateHealthCondition(id, dto);
  }

  @Delete('catalog/health-conditions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteHealthCondition(@Param('id', ParseIntPipe) id: number) {
    return this.catalogUseCase.deleteHealthCondition(id);
  }

  // ── Catalog — Cuisines ───────────────────────────────────────────────────

  @Get('catalog/cuisines')
  listCuisines() {
    return this.catalogUseCase.listCuisines();
  }

  @Post('catalog/cuisines')
  createCuisine(@Body() dto: CreateCuisineDto) {
    return this.catalogUseCase.createCuisine(dto.name);
  }

  @Patch('catalog/cuisines/:id')
  updateCuisine(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCuisineDto) {
    return this.catalogUseCase.updateCuisine(id, dto.name);
  }

  @Delete('catalog/cuisines/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCuisine(@Param('id', ParseIntPipe) id: number) {
    return this.catalogUseCase.deleteCuisine(id);
  }

  // ── Content — Nutrition Products ─────────────────────────────────────────

  @Get('nutrition-products')
  listNutritionProducts(@Query() dto: ListNutritionProductsDto) {
    return this.contentUseCase.listNutritionProducts(dto);
  }

  @Delete('nutrition-products/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteNutritionProduct(@Param('id') id: string) {
    return this.contentUseCase.deleteNutritionProduct(id);
  }

  // ── Content — Posts ──────────────────────────────────────────────────────

  @Get('posts')
  listPosts(@Query() dto: ListPostsAdminDto) {
    return this.contentUseCase.listPosts(dto);
  }

  @Delete('posts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePost(@Param('id') id: string) {
    return this.contentUseCase.deletePost(id);
  }

  // ── Content — Challenges ─────────────────────────────────────────────────

  @Get('challenges')
  listChallenges(@Query() dto: ListPostsAdminDto) {
    return this.contentUseCase.listChallenges(dto);
  }
}
