import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';

export interface RateLimitOptions {
  /** Requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

const RATE_LIMIT_KEY = 'vazon:rate-limit';

/** Limits how often one client (by IP address) can call the route. */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

/**
 * Sliding-window counter in memory. Enough for one API instance (the free
 * Render plan runs one); with several instances each would count on its own.
 */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  /** Records a hit; returns seconds to wait, or 0 when the hit is allowed. */
  hit(key: string, options: RateLimitOptions, now = Date.now()): number {
    const since = now - options.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > since);
    if (recent.length >= options.limit) {
      this.hits.set(key, recent);
      return Math.max(
        1,
        Math.ceil((recent[0] + options.windowMs - now) / 1000),
      );
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > 10_000) this.prune(since);
    return 0;
  }

  private prune(since: number): void {
    for (const [key, times] of this.hits) {
      if (times.every((t) => t <= since)) this.hits.delete(key);
    }
  }
}

/** Shared by every route, so counts survive between requests. */
const limiter = new RateLimiter();

/**
 * Answers 429 with code TOO_MANY_REQUESTS and a Retry-After header when a
 * client goes over the route's @RateLimit. Off in tests (NODE_ENV=test).
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (process.env.NODE_ENV === 'test') return true;
    const options = this.reflector.get<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );
    if (!options) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const routePath = (request.route as { path?: string } | undefined)?.path;
    const route = `${request.method} ${routePath ?? request.path}`;
    const key = `${route}|${request.ip ?? 'unknown'}`;
    const wait = limiter.hit(key, options);
    if (wait === 0) return true;

    context
      .switchToHttp()
      .getResponse<Response>()
      .setHeader('Retry-After', String(wait));
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        code: 'TOO_MANY_REQUESTS',
        error: 'Too Many Requests',
        message: `Too many attempts. Try again in ${wait} seconds.`,
        retryAfter: wait,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
