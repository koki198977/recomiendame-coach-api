import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ProcessEmotionalCheckinUseCase } from '../../core/application/chapi/use-cases/process-emotional-checkin.usecase';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chapi')
@UseGuards(JwtAuthGuard)
export class ChapiController {
  constructor(
    private readonly processCheckin: ProcessEmotionalCheckinUseCase,
  ) {}

  @Post('check-in')
  async checkIn(@Body() body: { message: string }, @Request() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    const result = await this.processCheckin.execute({
      userId,
      message: body.message,
    });

    if (result.ok) {
      return result.value;
    } else {
      throw result.error;
    }
  }
}
