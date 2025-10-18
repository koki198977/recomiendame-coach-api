export interface MailerPort {
  /**
   * Envía un correo usando un template (por nombre) o un HTML literal.
   * Si `templateOrHtml` comienza con `<`, se toma como HTML puro.
   */
  sendEmailVerification(
    to: string,
    subject: string,
    templateOrHtml: string,
    context?: any,
  ): Promise<void>;
}
export const MAILER_PORT = Symbol('MAILER_PORT');
