import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PlantsModule } from '../plants/plants.module.js';
import { CareHistoryController } from './care-history.controller.js';
import { CareHistoryService } from './care-history.service.js';

@Module({
  // AuthModule provides JwtAuthGuard; PlantsModule provides the ownership check.
  imports: [AuthModule, PlantsModule],
  controllers: [CareHistoryController],
  providers: [CareHistoryService],
})
export class CareHistoryModule {}
