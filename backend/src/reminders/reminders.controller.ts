import { timingSafeEqual } from 'node:crypto';
import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import {
  type ReminderRunSummary,
  RemindersService,
} from './reminders.service.js';

function sameSecret(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Called by the scheduled GitHub Actions workflow
 * (.github/workflows/reminders.yml), not by users. Hidden from Swagger.
 */
@ApiExcludeController()
@Controller('internal/reminders')
export class RemindersController {
  constructor(
    private readonly reminders: RemindersService,
    private readonly config: ConfigService,
  ) {}

  @Post('run')
  @HttpCode(HttpStatus.OK)
  run(
    @Headers('x-cron-secret') secret: string | undefined,
  ): Promise<ReminderRunSummary> {
    const expected = this.config.get<string>('CRON_SECRET');
    // Without a configured secret the endpoint does not exist.
    if (!expected) throw new NotFoundException();
    if (!secret || !sameSecret(secret, expected)) {
      throw new UnauthorizedException();
    }
    return this.reminders.run();
  }
}
