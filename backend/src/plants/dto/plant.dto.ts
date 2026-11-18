import { ApiProperty } from '@nestjs/swagger';
import type { Plant } from '../../generated/prisma/client.js';
import {
  LightCondition,
  PotSize,
  RadiatorDistance,
} from '../../generated/prisma/enums.js';

/** The Plant object from docs/api.md. */
export class PlantDto {
  @ApiProperty({ example: '3f2b8c1e-6a4d-4e0f-9b7a-1c2d3e4f5a6b' })
  id!: string;

  @ApiProperty({ example: '9a1b2c3d-4e5f-4a6b-8c7d-0e1f2a3b4c5d' })
  ownerId!: string;

  @ApiProperty({ example: 'Living room monstera' })
  name!: string;

  @ApiProperty({ example: 'Monstera deliciosa' })
  species!: string;

  @ApiProperty({ enum: LightCondition })
  lightCondition!: LightCondition;

  @ApiProperty({ enum: PotSize })
  potSize!: PotSize;

  @ApiProperty({ enum: RadiatorDistance })
  radiatorDistance!: RadiatorDistance;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Link to the species catalog, or null',
  })
  speciesId!: string | null;

  @ApiProperty({ example: '2026-11-18T09:30:00.000Z' })
  createdAt!: Date;
}

/** Maps a database row to the API shape. Leaves out fields the contract does not list. */
export function toPlantDto(plant: Plant): PlantDto {
  return {
    id: plant.id,
    ownerId: plant.ownerId,
    name: plant.name,
    species: plant.species,
    lightCondition: plant.lightCondition,
    potSize: plant.potSize,
    radiatorDistance: plant.radiatorDistance,
    speciesId: plant.speciesId,
    createdAt: plant.createdAt,
  };
}
