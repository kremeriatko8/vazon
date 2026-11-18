import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const CARE_TASK_STATUSES = ['OVERDUE', 'TODAY', 'UPCOMING'] as const;
export type CareTaskStatusValue = (typeof CARE_TASK_STATUSES)[number];

export const SCHEDULED_TASK_TYPES = ['WATER', 'FEED'] as const;
export type ScheduledTaskType = (typeof SCHEDULED_TASK_TYPES)[number];

export class WaterAmountDto {
  @ApiProperty({ example: 300 })
  min!: number;

  @ApiProperty({ example: 500 })
  max!: number;
}

/** One upcoming care task, computed from the plant and its care history. */
export class CareTaskDto {
  @ApiProperty({ example: '3f2b8c1e-6a4d-4e0f-9b7a-1c2d3e4f5a6b' })
  plantId!: string;

  @ApiProperty({ example: 'Living room monstera' })
  plantName!: string;

  @ApiProperty({ example: 'Monstera deliciosa' })
  species!: string;

  @ApiProperty({ enum: SCHEDULED_TASK_TYPES })
  taskType!: ScheduledTaskType;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '2026-11-18T09:30:00.000Z',
    description: 'Last time this action was logged (UTC, ISO 8601), or null',
  })
  lastDoneAt!: string | null;

  @ApiProperty({
    example: '2026-11-25',
    description:
      'Due day in Europe/Kyiv, YYYY-MM-DD. May be in the past (overdue).',
  })
  nextDueDate!: string;

  @ApiProperty({ example: 7, description: 'Current interval in days' })
  intervalDays!: number;

  @ApiProperty({ enum: CARE_TASK_STATUSES })
  status!: CareTaskStatusValue;

  @ApiPropertyOptional({
    type: WaterAmountDto,
    description: 'Approximate water per watering (WATER tasks only)',
  })
  waterAmountMl?: WaterAmountDto;
}
