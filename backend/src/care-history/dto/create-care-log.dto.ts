import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CareActionType } from '../../generated/prisma/enums.js';

/**
 * Actions an owner can log by hand. DONE is also in the Prisma enum, but it
 * marks a completed scheduled task and is not accepted here.
 */
export const LOGGABLE_ACTION_TYPES = [
  CareActionType.WATERED,
  CareActionType.FED,
  CareActionType.REPOTTED,
  CareActionType.SOIL_WET,
] as const;

export type LoggableActionType = (typeof LOGGABLE_ACTION_TYPES)[number];

export const MAX_NOTES_LENGTH = 500;

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Body of POST /api/v1/plants/:plantId/care-history. */
export class CreateCareLogDto {
  @ApiProperty({ enum: LOGGABLE_ACTION_TYPES, example: CareActionType.WATERED })
  @IsIn(LOGGABLE_ACTION_TYPES)
  actionType!: LoggableActionType;

  @ApiPropertyOptional({
    example: 'Filtered room-temperature water.',
    maxLength: MAX_NOTES_LENGTH,
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(MAX_NOTES_LENGTH)
  notes?: string;
}
