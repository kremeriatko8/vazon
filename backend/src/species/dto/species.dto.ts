import { ApiProperty } from '@nestjs/swagger';
import type { Species } from '../../generated/prisma/client.js';
import { LightCondition } from '../../generated/prisma/enums.js';

/** The Species object from docs/api.md. */
export class SpeciesDto {
  @ApiProperty({ example: '7c9e6679-7425-40de-944b-e07fc1f90ae7' })
  id!: string;

  @ApiProperty({ example: 'Monstera Deliciosa' })
  scientificName!: string;

  @ApiProperty({ example: 'Swiss Cheese Plant' })
  commonName!: string;

  @ApiProperty({ enum: LightCondition })
  recommendedLight!: LightCondition;

  @ApiProperty({ type: String, nullable: true, example: null })
  photoUrl!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Photo: Jane Doe, CC BY-SA 4.0, via Wikimedia Commons',
  })
  photoAttribution!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'Page of the photo on Wikimedia Commons; link the attribution to it',
  })
  photoSourceUrl!: string | null;
}

export function toSpeciesDto(species: Species): SpeciesDto {
  return {
    id: species.id,
    scientificName: species.scientificName,
    commonName: species.commonName,
    recommendedLight: species.recommendedLight,
    photoUrl: species.photoUrl,
    photoAttribution: species.photoAttribution,
    photoSourceUrl: species.photoSourceUrl,
  };
}
