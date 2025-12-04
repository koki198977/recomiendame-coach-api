import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { SendContactEmailDto } from '../../core/application/contact/dto/send-contact-email.dto';
import { SendContactEmailUseCase } from '../../core/application/contact/use-cases/send-contact-email.usecase';

@Controller('contact')
export class ContactController {
  constructor(
    private readonly sendContactEmail: SendContactEmailUseCase,
  ) {}

  @Post('send-email')
  async sendEmail(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: SendContactEmailDto,
  ) {
    return this.sendContactEmail.execute(dto);
  }
}
