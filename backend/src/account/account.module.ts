import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MailModule } from '../mail/mail.module.js';
import { PlantsModule } from '../plants/plants.module.js';
import { AccountController } from './account.controller.js';
import { AccountService } from './account.service.js';

@Module({
  // AuthModule: JwtAuthGuard; PlantsModule: PhotoStorageService for deletion.
  imports: [AuthModule, MailModule, PlantsModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
