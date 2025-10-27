import { Controller, Get, Query, Res } from '@nestjs/common';
import { ConfirmAccountDeletionUseCase } from '../../core/application/auth/use-cases/confirm-account-deletion.usecase';
import { Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

@Controller()
export class AccountDeletionController {
  constructor(
    private readonly confirmDeletionUC: ConfirmAccountDeletionUseCase,
  ) {}

  @Get('confirm-account-deletion')
  async confirmDeletion(@Query('token') token: string, @Res() res: Response) {
    if (!token) {
      // Si no hay token, servir la página HTML
      try {
        const htmlPath = join(
          process.cwd(),
          'public',
          'confirm-account-deletion.html',
        );
        const html = readFileSync(htmlPath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
      } catch (error) {

        return res.status(404).json({ message: 'Página no encontrada' });
      }
    }

    // Si hay token, procesar la eliminación
    try {
      const result = await this.confirmDeletionUC.execute({ token });
      return res.json(result);
    } catch (error) {

      return res.status(400).json({
        message: error.message || 'Error al procesar la eliminación de cuenta',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }
}
