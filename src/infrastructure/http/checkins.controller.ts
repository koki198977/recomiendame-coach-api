import { Body, Controller, Get, Post, Query, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpsertCheckinUseCase } from '../../core/application/checkins/use-cases/upsert-checkin.usecase';
import { ListCheckinsUseCase } from '../../core/application/checkins/use-cases/list-checkins.usecase';
import { UpsertCheckinDto } from '../../core/application/checkins/dto/upsert-checkin.dto';
import { ListCheckinsDto } from '../../core/application/checkins/dto/list-checkins.dto';

@Controller('checkins')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class CheckinsController {
  constructor(
    private readonly upsertUC: UpsertCheckinUseCase,
    private readonly listUC: ListCheckinsUseCase,
  ) {}

  @Post()
  async upsertCheckin(@Req() req: any, @Body() body: any) {
    const userId = req.user.userId;
    return this.upsertUC.execute(userId, {
      date: body.date,                // 'YYYY-MM-DD'
      weightKg: body.weightKg ?? null,
      adherencePct: body.adherencePct ?? null,
      hungerLvl: body.hungerLvl ?? null,
      notes: body.notes ?? null,
    });
  }

  @Get()
  list(@Query() q: ListCheckinsDto, @Req() req: any) {
    return this.listUC.execute(req.user.userId, q);
  }
}
