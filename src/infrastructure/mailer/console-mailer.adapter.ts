import { Injectable, Logger } from '@nestjs/common';
import { MailerPort } from '../../core/application/auth/ports/out.mailer.port';

@Injectable()
export class ConsoleMailerAdapter implements MailerPort {
  private readonly log = new Logger(ConsoleMailerAdapter.name);
  async send(to: string, subject: string, html: string): Promise<void> {
    this.log.log(`✉️  Mail a: ${to}\nAsunto: ${subject}\nHTML:\n${html}`);
  }
}
