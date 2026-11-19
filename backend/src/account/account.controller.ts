import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  type AuthenticatedRequest,
  JwtAuthGuard,
} from '../auth/jwt-auth.guard.js';
import { RateLimit, RateLimitGuard } from '../common/rate-limit/rate-limit.js';
import { AccountService } from './account.service.js';
import {
  AccountDto,
  DeleteAccountDto,
  EmailLanguageDto,
  PasswordResetConfirmDto,
  PasswordResetRequestDto,
  TokenDto,
} from './dto/account.dto.js';

const HOUR = 60 * 60 * 1000;
const TOO_MANY = 'Too many attempts (code TOO_MANY_REQUESTS)';

@ApiTags('account')
@UseGuards(RateLimitGuard)
@Controller('account')
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiOperation({
    summary: 'The current account: email, verified, sign-in methods',
  })
  @ApiOkResponse({ type: AccountDto })
  get(@Req() request: AuthenticatedRequest): Promise<AccountDto> {
    return this.account.get(request.user.id);
  }

  @Post('email-verification')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @RateLimit({ limit: 5, windowMs: HOUR })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiOperation({
    summary: 'Email a link that confirms the address (24 hours)',
  })
  @ApiNoContentResponse({ description: 'Sent' })
  @ApiConflictResponse({ description: 'ALREADY_VERIFIED' })
  @ApiTooManyRequestsResponse({ description: TOO_MANY })
  async sendVerification(
    @Req() request: AuthenticatedRequest,
    @Body() dto: EmailLanguageDto,
  ): Promise<void> {
    await this.account.sendVerification(request.user.id, dto.language);
  }

  @Post('email-verification/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RateLimit({ limit: 20, windowMs: HOUR })
  @ApiOperation({ summary: 'Confirm the email with the token from the link' })
  @ApiNoContentResponse({ description: 'Confirmed' })
  @ApiBadRequestResponse({
    description: 'INVALID_TOKEN: wrong, used or expired',
  })
  @ApiTooManyRequestsResponse({ description: TOO_MANY })
  async confirmVerification(@Body() dto: TokenDto): Promise<void> {
    await this.account.confirmVerification(dto.token);
  }

  @Post('password-reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RateLimit({ limit: 5, windowMs: HOUR })
  @ApiOperation({
    summary:
      'Email a link to set a new password (1 hour). Always 204, so it does not reveal who has an account.',
  })
  @ApiNoContentResponse({ description: 'Sent if the account exists' })
  @ApiTooManyRequestsResponse({ description: TOO_MANY })
  async requestPasswordReset(
    @Body() dto: PasswordResetRequestDto,
  ): Promise<void> {
    await this.account.requestPasswordReset(dto.email, dto.language);
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RateLimit({ limit: 20, windowMs: HOUR })
  @ApiOperation({ summary: 'Set a new password with the token from the link' })
  @ApiNoContentResponse({
    description: 'Password changed; the email counts as confirmed',
  })
  @ApiBadRequestResponse({
    description: 'INVALID_TOKEN, or password not 8 to 72 characters',
  })
  @ApiTooManyRequestsResponse({ description: TOO_MANY })
  async confirmPasswordReset(
    @Body() dto: PasswordResetConfirmDto,
  ): Promise<void> {
    await this.account.confirmPasswordReset(dto.token, dto.password);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @RateLimit({ limit: 5, windowMs: HOUR })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiOperation({
    summary:
      'Delete the account with all plants, care history, settings and photos. Confirm by typing the email.',
  })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiBadRequestResponse({ description: 'EMAIL_MISMATCH' })
  async delete(
    @Req() request: AuthenticatedRequest,
    @Body() dto: DeleteAccountDto,
  ): Promise<void> {
    await this.account.delete(request.user.id, dto.confirmEmail);
  }
}
