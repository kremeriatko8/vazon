import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsString, IsUUID, Length, ValidateIf } from 'class-validator';
import {
  LightCondition,
  PotSize,
  RadiatorDistance,
} from '../../generated/prisma/enums.js';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Validate only when the field was sent. `null` is NOT skipped, so it fails the type check. */
const whenSent = ValidateIf((_object, value) => value !== undefined);

/**
 * Body of PATCH /api/v1/plants/:plantId. Every field is optional; only the
 * fields that are sent change. `speciesId: null` removes the catalog link;
 * the other fields cannot be null.
 */
export class UpdatePlantDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 100 })
  @whenSent
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({ minLength: 1, maxLength: 150 })
  @whenSent
  @Transform(trim)
  @IsString()
  @Length(1, 150)
  species?: string;

  @ApiPropertyOptional({ enum: LightCondition })
  @whenSent
  @IsEnum(LightCondition)
  lightCondition?: LightCondition;

  @ApiPropertyOptional({ enum: PotSize })
  @whenSent
  @IsEnum(PotSize)
  potSize?: PotSize;

  @ApiPropertyOptional({ enum: RadiatorDistance })
  @whenSent
  @IsEnum(RadiatorDistance)
  radiatorDistance?: RadiatorDistance;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Id from GET /api/v1/species, or null to remove the link',
  })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsUUID()
  speciesId?: string | null;
}

/** Field names a PATCH body may contain (used to reject an empty body). */
export const UPDATABLE_PLANT_FIELDS = [
  'name',
  'species',
  'lightCondition',
  'potSize',
  'radiatorDistance',
  'speciesId',
] as const satisfies ReadonlyArray<keyof UpdatePlantDto>;
