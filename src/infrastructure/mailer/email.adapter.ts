import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { MailerPort } from 'src/core/application/auth/ports/out.mailer.port';

@Injectable()
export class EmailAdapter implements MailerPort {
  constructor(private readonly mailer: MailerService) {}

  async sendEmailVerification(
    to: string,
    subject: string,
    templateOrHtml: string,
    context: any = {},
  ): Promise<void> {
    const trimmed = templateOrHtml.trimStart();
    const isHtmlLiteral = trimmed.startsWith('<');

    await this.mailer.sendMail({
      to,
      subject,
      ...(isHtmlLiteral
        ? { html: templateOrHtml }
        : { template: templateOrHtml, context }),
    });
  }
}

