import { ApiProperty } from '@nestjs/swagger';

/** Response of POST /api/v1/feedback. The message is not echoed back. */
export class FeedbackCreatedDto {
  @ApiProperty({ example: '5b1e2c3d-4f5a-4b6c-8d7e-9f0a1b2c3d4e' })
  id!: string;

  @ApiProperty({ example: '2026-11-18T09:30:00.000Z' })
  createdAt!: Date;
}
