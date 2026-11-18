import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PlantsModule } from '../plants/plants.module.js';
import { PlantHealthController } from './plant-health.controller.js';
import { PlantHealthService } from './plant-health.service.js';

@Module({
  // AuthModule provides JwtAuthGuard; PlantsModule provides the ownership check.
  imports: [AuthModule, PlantsModule],
  controllers: [PlantHealthController],
  providers: [PlantHealthService],
})
export class PlantHealthModule {}
