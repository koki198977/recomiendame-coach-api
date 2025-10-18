// import { Injectable } from '@nestjs/common';
// import { MailerPort } from 'src/core/application/auth/ports/out.mailer.port';

// @Injectable()
// export class VerificationMailerAdapter implements MailerPort {
//   constructor(private readonly emails: MailerPort) {}

//   async sendEmail(to: string, subject: string, html: string): Promise<void> {
//     await this.emails.sendEmail(to, subject, html);
//   }

//   async sendEmailVerification(to: string, link: string): Promise<void> {
//     await this.emails.sendEmail(to, 'Verifica tu correo', 'welcome');
//   }
// }
