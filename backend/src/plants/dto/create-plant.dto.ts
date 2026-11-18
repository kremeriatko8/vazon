import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import {
  LightCondition,
  PotSize,
  RadiatorDistance,
} from '../../generated/prisma/enums.js';

/** Trims surrounding spaces so that "   " fails the length check. */
const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Body of POST /api/v1/plants. Field limits follow schema.prisma. */
export class CreatePlantDto {
  @ApiProperty({
    example: 'Living room monstera',
    minLength: 1,
    maxLength: 100,
  })
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  name!: string;

  @ApiProperty({ example: 'Monstera deliciosa', minLength: 1, maxLength: 150 })
  @Transform(trim)
  @IsString()
  @Length(1, 150)
  species!: string;

  @ApiProperty({
    enum: LightCondition,
    example: LightCondition.BRIGHT_INDIRECT,
  })
  @IsEnum(LightCondition)
  lightCondition!: LightCondition;

  @ApiProperty({ enum: PotSize, example: PotSize.MEDIUM })
  @IsEnum(PotSize)
  potSize!: PotSize;

  @ApiPropertyOptional({
    enum: RadiatorDistance,
    default: RadiatorDistance.NONE,
    example: RadiatorDistance.FAR,
  })
  @IsOptional()
  @IsEnum(RadiatorDistance)
  radiatorDistance?: RadiatorDistance;

  @ApiPropertyOptional({
    description:
      'Id from GET /api/v1/species. The frontend also copies the name into `species`.',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  @IsOptional()
  @IsUUID()
  speciesId?: string;
}
