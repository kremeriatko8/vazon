import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { AuthResponseDto, AuthUserDto } from './dto/auth-responses.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import {
  GoogleOAuthService,
  GoogleSignInError,
} from './google-oauth.service.js';
import { type AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly google: GoogleOAuthService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Create a user account' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid email, or password not 8 to 72 characters',
  })
  @ApiConflictResponse({ description: 'The email is already registered' })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange email and password for an access token' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Missing or malformed fields' })
  @ApiUnauthorizedResponse({ description: 'Wrong email or password' })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return the current user' })
  @ApiOkResponse({ type: AuthUserDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  me(@Req() request: AuthenticatedRequest): Promise<AuthUserDto> {
    return this.authService.me(request.user.id);
  }

  @Get('google')
  @ApiOperation({
    summary: 'Start Google sign-in (open in the browser, not with fetch)',
  })
  @ApiFoundResponse({ description: 'Redirect to Google' })
  startGoogle(@Res() response: Response): void {
    if (!this.google.isConfigured) {
      return this.backToFrontend(response, { error: 'google_not_configured' });
    }
    const state = this.google.newState();
    response.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: response.req.secure,
      path: STATE_COOKIE_PATH,
      maxAge: 10 * 60 * 1000,
    });
    response.redirect(this.google.authorizationUrl(state));
  }

  @Get('google/callback')
  @ApiOperation({
    summary:
      'Google returns here; redirects to /auth/callback#accessToken=… on the frontend',
  })
  @ApiFoundResponse({ description: 'Redirect to the frontend' })
  async googleCallback(
    @Req() request: Request,
    @Res() response: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
  ): Promise<void> {
    const expectedState = readCookie(request, STATE_COOKIE);
    response.clearCookie(STATE_COOKIE, { path: STATE_COOKIE_PATH });

    if (error) {
      return this.backToFrontend(response, {
        error: error === 'access_denied' ? 'access_denied' : 'google_error',
      });
    }
    if (!code || !state || !expectedState || state !== expectedState) {
      return this.backToFrontend(response, { error: 'invalid_state' });
    }
    try {
      const profile = await this.google.profileFromCode(code);
      const auth = await this.authService.signInWithGoogle(profile);
      // The fragment is never sent to a server, so the token stays out of logs.
      const fragment = new URLSearchParams({ accessToken: auth.accessToken });
      response.redirect(
        `${this.google.frontendCallbackUrl}#${fragment.toString()}`,
      );
    } catch (failure) {
      if (failure instanceof GoogleSignInError) {
        return this.backToFrontend(response, { error: failure.reason });
      }
      throw failure;
    }
  }

  private backToFrontend(
    response: Response,
    query: Record<string, string>,
  ): void {
    const params = new URLSearchParams(query);
    response.redirect(
      `${this.google.frontendCallbackUrl}?${params.toString()}`,
    );
  }
}

const STATE_COOKIE = 'vazon_google_state';
const STATE_COOKIE_PATH = '/api/v1/auth/google';

function readCookie(request: Request, name: string): string | undefined {
  for (const part of (request.headers.cookie ?? '').split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return undefined;
}
