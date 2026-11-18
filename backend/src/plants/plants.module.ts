import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PlantsController } from './plants.controller.js';
import { PlantsService } from './plants.service.js';

@Module({
  // AuthModule provides JwtAuthGuard and the JwtService it needs.
  imports: [AuthModule],
  controllers: [PlantsController],
  providers: [PlantsService],
  // Care history and tasks use PlantsService.findOwnedOrThrow to check ownership.
  exports: [PlantsService],
})
export class PlantsModule {}
