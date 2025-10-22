import {
  BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query,
  UseGuards, UsePipes, ValidationPipe
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';



import {
  ListAllergiesUC, CreateAllergyUC, UpdateAllergyUC, DeleteAllergyUC
} from '../../core/application/taxonomies/use-cases/admin-allergies.usecases';
import {
  ListConditionsUC, CreateConditionUC, UpdateConditionUC, DeleteConditionUC
} from '../../core/application/taxonomies/use-cases/admin-conditions.usecases';
import {
  ListCuisinesUC, CreateCuisineUC, UpdateCuisineUC, DeleteCuisineUC
} from '../../core/application/taxonomies/use-cases/admin-cuisines.usecases';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreateAllergyDto, CreateConditionDto, CreateCuisineDto, PageQueryDto, UpdateAllergyDto, UpdateConditionDto, UpdateCuisineDto } from 'src/core/application/taxonomies/dto/admin-taxonomies.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/taxonomies')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TaxonomiesAdminController {
  constructor(
    private listAllergiesUC: ListAllergiesUC,
    private createAllergyUC: CreateAllergyUC,
    private updateAllergyUC: UpdateAllergyUC,
    private deleteAllergyUC: DeleteAllergyUC,
    private listConditionsUC: ListConditionsUC,
    private createConditionUC: CreateConditionUC,
    private updateConditionUC: UpdateConditionUC,
    private deleteConditionUC: DeleteConditionUC,
    private listCuisinesUC: ListCuisinesUC,
    private createCuisineUC: CreateCuisineUC,
    private updateCuisineUC: UpdateCuisineUC,
    private deleteCuisineUC: DeleteCuisineUC,
  ) { }

  // Allergies
  @Get('allergies')
  listAllergies(@Query() q: PageQueryDto) { return this.listAllergiesUC.execute(q); }
  @Post('allergies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createAllergy(@Body() dto: CreateAllergyDto) {
    try { return await this.createAllergyUC.execute(dto.name); } catch (e) { this.handle(e); }
  }

  @Put('allergies/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateAllergy(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAllergyDto) {
    try { return await this.updateAllergyUC.execute(id, dto.name); } catch (e) { this.handle(e); }
  }

  @Delete('allergies/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteAllergy(@Param('id', ParseIntPipe) id: number) {
    try { return await this.deleteAllergyUC.execute(id); } catch (e) { this.handle(e); }
  }

  // Conditions
  @Get('conditions')
  listConditions(@Query() q: PageQueryDto) { return this.listConditionsUC.execute(q); }
  @Post('conditions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createCondition(@Body() dto: CreateConditionDto) {
    try { return await this.createConditionUC.execute(dto); } catch (e) { this.handle(e); }
  }

  @Put('conditions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateCondition(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateConditionDto) {
    try { return await this.updateConditionUC.execute(id, dto); } catch (e) { this.handle(e); }
  }

  @Delete('conditions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteCondition(@Param('id', ParseIntPipe) id: number) {
    try { return await this.deleteConditionUC.execute(id); } catch (e) { this.handle(e); }
  }

  // Cuisines
  @Get('cuisines')
  listCuisines(@Query() q: PageQueryDto) { return this.listCuisinesUC.execute(q); }
  @Post('cuisines')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createCuisine(@Body() dto: CreateCuisineDto) {
    try { return await this.createCuisineUC.execute(dto.name); } catch (e) { this.handle(e); }
  }

  @Put('cuisines/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateCuisine(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCuisineDto) {
    try { return await this.updateCuisineUC.execute(id, dto.name); } catch (e) { this.handle(e); }
  }

  @Delete('cuisines/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteCuisine(@Param('id', ParseIntPipe) id: number) {
    try { return await this.deleteCuisineUC.execute(id); } catch (e) { this.handle(e); }
  }

  private handle(e: any): never {
    if (e instanceof PrismaClientKnownRequestError) {
      if (e.code === 'P2002') throw new BadRequestException('Registro duplicado (campo único).');
      if (e.code === 'P2003') throw new BadRequestException('Violación de clave foránea.');
      if (e.code === 'P2025') throw new BadRequestException('Registro no encontrado.');
    }
    throw e;
  }
}
