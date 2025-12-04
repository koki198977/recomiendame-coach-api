import { Module } from '@nestjs/common';
import { ContactController } from '../infrastructure/http/contact.controller';
import { SendContactEmailUseCase } from '../core/application/contact/use-cases/send-contact-email.usecase';
import { AppMailerModule } from '../infrastructure/mailer/mailer.module';

@Module({
  imports: [AppMailerModule],
  controllers: [ContactController],
  providers: [SendContactEmailUseCase],
})
export class ContactModule {}
