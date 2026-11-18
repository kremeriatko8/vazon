import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { FeedbackController } from './feedback.controller.js';
import { FeedbackService } from './feedback.service.js';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard.js';

@Module({
  // AuthModule exports JwtModule, which OptionalJwtAuthGuard needs.
  imports: [AuthModule],
  controllers: [FeedbackController],
  providers: [FeedbackService, OptionalJwtAuthGuard],
})
export class FeedbackModule {}
