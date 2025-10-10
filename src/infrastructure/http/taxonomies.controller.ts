import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TaxonomiesPrismaRepository } from '../persistence/prisma/taxonomies.prisma.repository';
import { CreateAllergyDto, UpdateAllergyDto, PageQueryDto, CreateConditionDto, UpdateConditionDto, CreateCuisineDto, UpdateCuisineDto } from './dto/taxonomies.dto';
import { Prisma } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('taxonomies')
export class TaxonomiesController {
  constructor(private repo: TaxonomiesPrismaRepository) {}

  // ---------- Allergies ----------
  @Get('allergies')
  listAllergies(@Query() q: PageQueryDto) {
    const skip = q.skip ? Number(q.skip) : 0;
    const take = q.take ? Number(q.take) : 20;
    return this.repo.listAllergies({ search: q.search, skip, take });
  }
  @Post('allergies')
  async createAllergy(@Body() dto: CreateAllergyDto) {
    try { return await this.repo.createAllergy(dto.name); }
    catch (e) { this.handlePrismaErrors(e); }
  }
  @Put('allergies/:id')
  async updateAllergy(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAllergyDto) {
    try { return await this.repo.updateAllergy(id, dto.name); }
    catch (e) { this.handlePrismaErrors(e); }
  }
  @Delete('allergies/:id')
  async deleteAllergy(@Param('id', ParseIntPipe) id: number) {
    try { return await this.repo.deleteAllergy(id); }
    catch (e) { this.handlePrismaErrors(e); }
  }

  // ---------- Health Conditions ----------
  @Get('conditions')
  listConditions(@Query() q: PageQueryDto) {
    const skip = q.skip ? Number(q.skip) : 0;
    const take = q.take ? Number(q.take) : 20;
    return this.repo.listConditions({ search: q.search, skip, take });
  }
  @Post('conditions')
  async createCondition(@Body() dto: CreateConditionDto) {
    try { return await this.repo.createCondition(dto); }
    catch (e) { this.handlePrismaErrors(e); }
  }
  @Put('conditions/:id')
  async updateCondition(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateConditionDto) {
    try { return await this.repo.updateCondition(id, dto); }
    catch (e) { this.handlePrismaErrors(e); }
  }
  @Delete('conditions/:id')
  async deleteCondition(@Param('id', ParseIntPipe) id: number) {
    try { return await this.repo.deleteCondition(id); }
    catch (e) { this.handlePrismaErrors(e); }
  }

  // ---------- Cuisines ----------
  @Get('cuisines')
  listCuisines(@Query() q: PageQueryDto) {
    const skip = q.skip ? Number(q.skip) : 0;
    const take = q.take ? Number(q.take) : 20;
    return this.repo.listCuisines({ search: q.search, skip, take });
  }
  @Post('cuisines')
  async createCuisine(@Body() dto: CreateCuisineDto) {
    try { return await this.repo.createCuisine(dto.name); }
    catch (e) { this.handlePrismaErrors(e); }
  }
  @Put('cuisines/:id')
  async updateCuisine(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCuisineDto) {
    try { return await this.repo.updateCuisine(id, dto.name); }
    catch (e) { this.handlePrismaErrors(e); }
  }
  @Delete('cuisines/:id')
  async deleteCuisine(@Param('id', ParseIntPipe) id: number) {
    try { return await this.repo.deleteCuisine(id); }
    catch (e) { this.handlePrismaErrors(e); }
  }

  private handlePrismaErrors(e: any): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') throw new BadRequestException('Registro duplicado (campo único).');
      if (e.code === 'P2003') throw new BadRequestException('Violación de clave foránea.');
      if (e.code === 'P2025') throw new BadRequestException('Registro no encontrado.');
    }
    throw e;
  }
}
