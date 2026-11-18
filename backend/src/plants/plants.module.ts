import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { SpeciesModule } from '../species/species.module.js';
import { PlantsController } from './plants.controller.js';
import { PhotoStorageService } from './photos/photo-storage.service.js';
import { PlantsService } from './plants.service.js';

@Module({
  // AuthModule provides JwtAuthGuard and the JwtService it needs.
  imports: [AuthModule, SpeciesModule],
  controllers: [PlantsController],
  providers: [PlantsService, PhotoStorageService],
  // Care history and tasks use PlantsService.findOwnedOrThrow to check ownership.
  exports: [PlantsService],
})
export class PlantsModule {}
