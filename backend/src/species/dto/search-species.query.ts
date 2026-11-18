import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const DEFAULT_SPECIES_LIMIT = 10;
export const MAX_SPECIES_LIMIT = 100;

/** Query of GET /api/v1/species. */
export class SearchSpeciesQuery {
  @ApiPropertyOptional({
    description:
      'Part of the botanical or common name, case-insensitive. Without it, the catalog is listed alphabetically.',
    example: 'monst',
    maxLength: 100,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    default: DEFAULT_SPECIES_LIMIT,
    minimum: 1,
    maximum: MAX_SPECIES_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_SPECIES_LIMIT)
  limit?: number;
}
