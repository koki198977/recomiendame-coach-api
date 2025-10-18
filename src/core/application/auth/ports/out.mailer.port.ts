export interface MailerPort {
  /** Correo de verificación: recibe el link ya armado */
  sendEmailVerification(to: string, subject: string, template: string, context?: any): Promise<void>;

}
export const MAILER_PORT = Symbol('MAILER_PORT');
