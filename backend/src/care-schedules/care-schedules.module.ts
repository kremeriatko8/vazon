import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PlantsModule } from '../plants/plants.module.js';
import { CareTasksController } from './care-tasks.controller.js';
import { CareTasksService } from './care-tasks.service.js';

@Module({
  // AuthModule provides JwtAuthGuard; PlantsModule provides the ownership check.
  imports: [AuthModule, PlantsModule],
  controllers: [CareTasksController],
  providers: [CareTasksService],
  exports: [CareTasksService],
})
export class CareSchedulesModule {}
