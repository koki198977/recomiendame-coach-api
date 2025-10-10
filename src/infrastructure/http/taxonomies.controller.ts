import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListTaxonomiesUseCase } from '../../core/application/profile/use-cases/list-taxonomies.usecase';

@Controller('taxonomies')
@UseGuards(JwtAuthGuard)
export class TaxonomiesController {
  constructor(private readonly listUC: ListTaxonomiesUseCase) {}
  @Get()
  list() { return this.listUC.execute(); }
}
