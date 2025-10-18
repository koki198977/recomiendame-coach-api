import { MailerPort } from 'src/core/application/auth/ports/out.mailer.port';

export class ConsoleMailerAdapter implements MailerPort {
  async sendEmailVerification(
    to: string,
    subject: string,
    templateOrHtml: string,
    context: any = {},
  ): Promise<void> {
    const payload = templateOrHtml.trimStart().startsWith('<')
      ? templateOrHtml
      : { template: templateOrHtml, context };
    // eslint-disable-next-line no-console
    console.log('[MAIL DEV]', { to, subject, payload });
  }
}
