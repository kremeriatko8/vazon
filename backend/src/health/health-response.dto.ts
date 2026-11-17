import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', enum: ['ok'] })
  status!: 'ok';

  @ApiProperty({ example: 'vazon-backend' })
  service!: string;

  @ApiProperty({ example: '2026-11-17T14:00:00.000Z', description: 'Server time in UTC (ISO 8601)' })
  timestamp!: string;
}
