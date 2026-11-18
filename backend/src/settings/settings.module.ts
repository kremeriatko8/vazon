import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { SettingsController } from './settings.controller.js';
import { SettingsService } from './settings.service.js';

@Module({
  imports: [AuthModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  // Reminders will read the language and reminder time from here.
  exports: [SettingsService],
})
export class SettingsModule {}
