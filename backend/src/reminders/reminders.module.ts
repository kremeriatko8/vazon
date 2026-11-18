import { Module } from '@nestjs/common';
import { CareSchedulesModule } from '../care-schedules/care-schedules.module.js';
import { MailSender } from './mail.sender.js';
import { RemindersController } from './reminders.controller.js';
import { RemindersService } from './reminders.service.js';

@Module({
  imports: [CareSchedulesModule],
  controllers: [RemindersController],
  providers: [RemindersService, MailSender],
})
export class RemindersModule {}
