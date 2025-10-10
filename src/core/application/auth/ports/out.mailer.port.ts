export interface MailerPort {
  send(to: string, subject: string, html: string): Promise<void>;
}
export const MAILER_PORT = Symbol('MAILER_PORT');
