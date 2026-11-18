import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { JwtPayload } from '../auth/auth.service.js';

/** Request after OptionalJwtAuthGuard: `user` is set only for a valid token. */
export interface MaybeAuthenticatedRequest extends Request {
  user?: { id: string };
}

/**
 * Like JwtAuthGuard, but never rejects. A valid "Bearer" token sets
 * `request.user`; a missing, malformed or expired token leaves it undefined.
 * Used where anonymous visitors are welcome (feedback from the login page).
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<MaybeAuthenticatedRequest>();
    const [scheme, token, ...rest] = (
      request.headers.authorization ?? ''
    ).split(' ');
    if (scheme !== 'Bearer' || !token || rest.length > 0) return true;
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      if (typeof payload.sub === 'string' && payload.sub.length > 0) {
        request.user = { id: payload.sub };
      }
    } catch {
      // Invalid or expired: continue as an anonymous visitor.
    }
    return true;
  }
}
