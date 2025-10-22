import { Body, Controller, Post, Get, Query, UsePipes, ValidationPipe, Res } from '@nestjs/common';
import { RequestAccountDeletionUseCase } from '../../core/application/auth/use-cases/request-account-deletion.usecase';
import { ConfirmAccountDeletionUseCase } from '../../core/application/auth/use-cases/confirm-account-deletion.usecase';
import { RequestAccountDeletionDto } from '../../core/application/auth/dto/request-account-deletion.dto';
import { ConfirmAccountDeletionDto } from '../../core/application/auth/dto/confirm-account-deletion.dto';
import { Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

@Controller('auth')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AuthAccountDeletionController {
  constructor(
    private readonly requestDeletionUC: RequestAccountDeletionUseCase,
    private readonly confirmDeletionUC: ConfirmAccountDeletionUseCase,
  ) {}

  @Post('request-account-deletion')
  async requestDeletion(@Body() dto: RequestAccountDeletionDto) {
    return this.requestDeletionUC.execute(dto);
  }

  @Get('confirm-account-deletion')
  async confirmDeletion(@Query('token') token: string, @Res() res: Response) {
    if (!token) {
      // Si no hay token, servir la página HTML
      try {
        const htmlPath = join(process.cwd(), 'public', 'confirm-account-deletion.html');
        const html = readFileSync(htmlPath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
      } catch (error) {
        return res.status(404).json({ message: 'Página no encontrada' });
      }
    }
    
    // Si hay token, procesar la eliminación
    const result = await this.confirmDeletionUC.execute({ token });
    return res.json(result);
  }

  @Post('confirm-account-deletion')
  async confirmDeletionPost(@Body() dto: ConfirmAccountDeletionDto) {
    return this.confirmDeletionUC.execute(dto);
  }
}