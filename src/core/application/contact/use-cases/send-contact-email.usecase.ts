import { Injectable, BadRequestException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SendContactEmailDto } from '../dto/send-contact-email.dto';

@Injectable()
export class SendContactEmailUseCase {
  constructor(private readonly mailer: MailerService) {}

  async execute(dto: SendContactEmailDto) {
    try {
      // Validar que el destinatario sea el correo de soporte
      const allowedRecipients = [
        'coach-contacto@recomiendameapp.cl',
        'recomiendameappcl@gmail.com',
      ];

      if (!allowedRecipients.includes(dto.to)) {
        throw new BadRequestException(
          'Destinatario no permitido. Solo se puede enviar a coach-contacto@recomiendameapp.cl'
        );
      }

      await this.mailer.sendMail({
        to: dto.to,
        from: dto.from,
        replyTo: dto.replyTo || dto.from,
        subject: dto.subject,
        html: dto.html,
        text: dto.text,
      });

      return {
        success: true,
        message: 'Email enviado exitosamente',
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Error al enviar email: ${error.message}`
      );
    }
  }
}
