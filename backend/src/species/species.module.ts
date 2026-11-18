import { Module } from '@nestjs/common';
import { SpeciesController } from './species.controller.js';
import { SpeciesService } from './species.service.js';

@Module({
  controllers: [SpeciesController],
  providers: [SpeciesService],
  // Plants use SpeciesService.findById to validate speciesId.
  exports: [SpeciesService],
})
export class SpeciesModule {}
