import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { MailerPort } from 'src/core/application/auth/ports/out.mailer.port';

@Injectable()
export class EmailAdapter implements MailerPort {
  constructor(private readonly mailer: MailerService) {}
  async sendEmailVerification(
    to: string,
    subject: string,
    template: string,
    context: any = {},
  ): Promise<void> {
    await this.mailer.sendMail({
      to,
      subject,
      template,
      context,
    });
  }
}


