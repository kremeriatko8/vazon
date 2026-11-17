import { Injectable } from '@nestjs/common';
import { HealthResponseDto } from './health-response.dto.js';

@Injectable()
export class HealthService {
  /** Liveness only: reports that the API process is running. It does not query the database. */
  check(): HealthResponseDto {
    return { status: 'ok', service: 'vazon-backend', timestamp: new Date().toISOString() };
  }
}
