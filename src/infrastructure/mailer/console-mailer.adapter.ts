import { MailerPort } from 'src/core/application/auth/ports/out.mailer.port';

export class ConsoleMailerAdapter implements MailerPort {
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('[MAIL DEV]', { to, subject, html });
  }
  async sendEmailVerification(to: string, link: string): Promise<void> {
    const html = `<p>Verifica tu correo: <a href="${link}">${link}</a></p>`;
    await this.sendEmail(to, 'Verifica tu correo', html);
  }
}
