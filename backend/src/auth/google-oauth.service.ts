import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseCorsOrigins } from '../config/env.validation.js';

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

/** The Google account, as reported by Google's userinfo endpoint. */
export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
}

/** Thrown when Google rejects the code or returns an unusable profile. */
export class GoogleSignInError extends Error {
  constructor(readonly reason: string) {
    super(`Google sign-in failed: ${reason}`);
    this.name = 'GoogleSignInError';
  }
}

/**
 * Server-side OAuth 2.0 authorization code flow with Google.
 * Only the "openid email" scopes are requested.
 */
@Injectable()
export class GoogleOAuthService {
  constructor(private readonly config: ConfigService) {}

  get isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  /** The browser page Google returns to; the token goes in the URL fragment. */
  get frontendCallbackUrl(): string {
    const base =
      this.config.get<string>('FRONTEND_URL') ||
      parseCorsOrigins(this.config.get<string>('CORS_ORIGINS') ?? '')[0] ||
      'http://localhost:5180';
    return `${base.replace(/\/+$/, '')}/auth/callback`;
  }

  /** Random value bound to the browser by a cookie, checked on return (CSRF). */
  newState(): string {
    return randomBytes(24).toString('base64url');
  }

  authorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId ?? '',
      redirect_uri: this.callbackUrl,
      response_type: 'code',
      scope: 'openid email',
      state,
      prompt: 'select_account',
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  }

  /** Exchanges the authorization code and reads the signed-in Google account. */
  async profileFromCode(code: string): Promise<GoogleProfile> {
    const tokenResponse = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId ?? '',
        client_secret: this.clientSecret ?? '',
        redirect_uri: this.callbackUrl,
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!tokenResponse.ok) throw new GoogleSignInError('code_exchange_failed');
    const { access_token: accessToken } = (await tokenResponse.json()) as {
      access_token?: unknown;
    };
    if (typeof accessToken !== 'string') {
      throw new GoogleSignInError('code_exchange_failed');
    }

    const userinfoResponse = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!userinfoResponse.ok) throw new GoogleSignInError('profile_failed');
    const info = (await userinfoResponse.json()) as {
      sub?: unknown;
      email?: unknown;
      email_verified?: unknown;
    };
    if (typeof info.sub !== 'string' || typeof info.email !== 'string') {
      throw new GoogleSignInError('profile_failed');
    }
    return {
      sub: info.sub,
      email: info.email,
      emailVerified: info.email_verified === true,
    };
  }

  private get clientId(): string | undefined {
    return this.config.get<string>('GOOGLE_CLIENT_ID') || undefined;
  }

  private get clientSecret(): string | undefined {
    return this.config.get<string>('GOOGLE_CLIENT_SECRET') || undefined;
  }

  private get callbackUrl(): string {
    return (
      this.config.get<string>('GOOGLE_CALLBACK_URL') ||
      'http://localhost:3100/api/v1/auth/google/callback'
    );
  }
}
