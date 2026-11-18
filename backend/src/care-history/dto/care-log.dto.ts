import { ApiProperty } from '@nestjs/swagger';
import type { CareHistory } from '../../generated/prisma/client.js';
import { CareActionType } from '../../generated/prisma/enums.js';

/** One care log entry. Matches CareLog in frontend/src/types/plant.ts. */
export class CareLogDto {
  @ApiProperty({ example: '7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f' })
  id!: string;

  @ApiProperty({ example: '3f2b8c1e-6a4d-4e0f-9b7a-1c2d3e4f5a6b' })
  plantId!: string;

  @ApiProperty({ type: String, nullable: true, example: null })
  careTaskId!: string | null;

  @ApiProperty({ enum: CareActionType })
  actionType!: CareActionType;

  @ApiProperty({
    example: '2026-11-18T09:30:00.000Z',
    description: 'UTC, ISO 8601',
  })
  actionDate!: string;

  @ApiProperty({ type: String, nullable: true, example: 'Filtered water.' })
  notes!: string | null;

  @ApiProperty({
    example: '2026-11-18T09:30:00.000Z',
    description: 'UTC, ISO 8601',
  })
  createdAt!: string;
}

export function toCareLogDto(entry: CareHistory): CareLogDto {
  return {
    id: entry.id,
    plantId: entry.plantId,
    careTaskId: entry.careTaskId,
    actionType: entry.actionType,
    actionDate: entry.actionDate.toISOString(),
    notes: entry.notes,
    createdAt: entry.createdAt.toISOString(),
  };
}
