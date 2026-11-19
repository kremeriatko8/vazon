import { Module } from '@nestjs/common';
import { MailSender } from './mail.sender.js';

/** Email through the Brevo HTTP API; shared by reminders and account emails. */
@Module({
  providers: [MailSender],
  exports: [MailSender],
})
export class MailModule {}
