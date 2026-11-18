import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

export interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
  /** Extra fields from the thrown HttpException, e.g. code: "TOO_EARLY". */
  [extra: string]: unknown;
}

const RESERVED = new Set([
  'statusCode',
  'message',
  'error',
  'path',
  'timestamp',
]);

/** Copies the string, number and boolean fields an HttpException adds to its body. */
function extraFields(payload: object): Record<string, unknown> {
  const extras: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (RESERVED.has(key)) continue;
    if (['string', 'number', 'boolean'].includes(typeof value)) {
      extras[key] = value;
    }
  }
  return extras;
}

/**
 * Turns every thrown error into the same JSON shape, so the frontend only
 * has to handle one error format. Unexpected errors are logged and returned
 * as a generic 500 without internal details.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';
    let extras: Record<string, unknown> = {};

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        message = payload;
        error = exception.name;
      } else {
        const body = payload as { message?: string | string[]; error?: string };
        message = body.message ?? exception.message;
        error = body.error ?? exception.name;
        extras = extraFields(payload);
      }
    } else {
      this.logger.error(
        `Unhandled error on ${request.method} ${request.originalUrl}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorResponseBody = {
      ...extras,
      statusCode,
      message,
      error,
      path: request.originalUrl, // full path incl. /api/v1 (request.url can be prefix-relative)
      timestamp: new Date().toISOString(),
    };
    response.status(statusCode).json(body);
  }
}
