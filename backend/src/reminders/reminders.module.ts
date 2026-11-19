import { Module } from '@nestjs/common';
import { CareSchedulesModule } from '../care-schedules/care-schedules.module.js';
import { MailModule } from '../mail/mail.module.js';
import { RemindersController } from './reminders.controller.js';
import { RemindersService } from './reminders.service.js';

@Module({
  imports: [CareSchedulesModule, MailModule],
  controllers: [RemindersController],
  providers: [RemindersService],
})
export class RemindersModule {}
