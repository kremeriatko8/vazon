import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EmailTokenPurpose } from '../generated/prisma/enums.js';
import type { User } from '../generated/prisma/client.js';
import { hashPassword } from '../auth/password.js';
import { parseCorsOrigins } from '../config/env.validation.js';
import { MailSender } from '../mail/mail.sender.js';
import { PhotoStorageService } from '../plants/photos/photo-storage.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  type AccountEmailLanguage,
  passwordResetEmail,
  verificationEmail,
} from './account-emails.js';
import type { AccountDto } from './dto/account.dto.js';

/** How long an emailed link works. */
export const TOKEN_TTL_MS: Readonly<Record<EmailTokenPurpose, number>> = {
  VERIFY_EMAIL: 24 * 60 * 60 * 1000,
  RESET_PASSWORD: 60 * 60 * 1000,
};

/** Frontend page each link opens. */
const LINK_PATH: Readonly<Record<EmailTokenPurpose, string>> = {
  VERIFY_EMAIL: '/verify-email',
  RESET_PASSWORD: '/reset-password',
};

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function isEmailVerified(
  user: Pick<User, 'emailVerifiedAt' | 'googleId'>,
): boolean {
  return Boolean(user.emailVerifiedAt || user.googleId);
}

const invalidToken = () =>
  new BadRequestException({
    statusCode: 400,
    code: 'INVALID_TOKEN',
    error: 'Bad Request',
    message: 'The link is invalid or has expired. Ask for a new one.',
  });

/**
 * Account self-service: email verification, password reset and deletion.
 * Emailed links carry a random token; only its SHA-256 hash is stored, it
 * works once and expires (TOKEN_TTL_MS).
 */
@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailSender,
    private readonly config: ConfigService,
    private readonly photos: PhotoStorageService,
  ) {}

  async get(userId: string): Promise<AccountDto> {
    const user = await this.userOr401(userId);
    return {
      email: user.email,
      emailVerified: isEmailVerified(user),
      hasPassword: Boolean(user.passwordHash),
      googleLinked: Boolean(user.googleId),
      createdAt: user.createdAt.toISOString(),
    };
  }

  /** Sends a new verification link. 409 ALREADY_VERIFIED when not needed. */
  async sendVerification(
    userId: string,
    language?: AccountEmailLanguage,
    now = new Date(),
  ): Promise<void> {
    const user = await this.userOr401(userId);
    if (isEmailVerified(user)) {
      throw new ConflictException({
        statusCode: 409,
        code: 'ALREADY_VERIFIED',
        error: 'Conflict',
        message: 'The email is already confirmed.',
      });
    }
    const link = await this.newLink(user.id, 'VERIFY_EMAIL', now);
    await this.mail.send({
      to: user.email,
      ...verificationEmail(language ?? (await this.language(user.id)), link),
    });
  }

  async confirmVerification(token: string, now = new Date()): Promise<void> {
    const entry = await this.useToken(token, 'VERIFY_EMAIL', now);
    await this.prisma.user.update({
      where: { id: entry.userId },
      data: { emailVerifiedAt: now },
    });
  }

  /**
   * Emails a reset link if the address has an account. Always resolves the
   * same way, so the endpoint does not reveal who is registered.
   */
  async requestPasswordReset(
    email: string,
    language?: AccountEmailLanguage,
    now = new Date(),
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) return;
    try {
      const link = await this.newLink(user.id, 'RESET_PASSWORD', now);
      await this.mail.send({
        to: user.email,
        ...passwordResetEmail(language ?? (await this.language(user.id)), link),
      });
    } catch (error) {
      // Same answer either way; the failure is only logged.
      this.logger.error(
        'Password reset email failed',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Sets a new password from a reset link. Opening the link also proves the
   * owner reads this inbox, so the email counts as confirmed.
   */
  async confirmPasswordReset(
    token: string,
    password: string,
    now = new Date(),
  ): Promise<void> {
    const entry = await this.useToken(token, 'RESET_PASSWORD', now);
    const user = await this.userOr401(entry.userId);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(password),
        emailVerifiedAt: user.emailVerifiedAt ?? now,
      },
    });
    // Other reset links for this account stop working.
    await this.prisma.emailToken.deleteMany({
      where: { userId: user.id, purpose: 'RESET_PASSWORD', usedAt: null },
    });
  }

  /**
   * Deletes the account with its plants, care history, settings and photo
   * files. Feedback stays, without the link to the account.
   */
  async delete(userId: string, confirmEmail: string): Promise<void> {
    const user = await this.userOr401(userId);
    if (confirmEmail.trim().toLowerCase() !== user.email) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'EMAIL_MISMATCH',
        error: 'Bad Request',
        message: 'Type the email of this account to confirm.',
      });
    }
    const photos = await this.prisma.plant.findMany({
      where: { ownerId: user.id, photoKey: { not: null } },
      select: { photoKey: true },
    });
    await this.prisma.user.delete({ where: { id: user.id } });
    for (const { photoKey } of photos) {
      if (photoKey) await this.photos.remove(photoKey);
    }
  }

  private async userOr401(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    // A valid token for a deleted user is treated as an invalid token.
    if (!user) throw new UnauthorizedException();
    return user;
  }

  /** Replaces earlier unused links of the same kind and returns the new link. */
  private async newLink(
    userId: string,
    purpose: EmailTokenPurpose,
    now: Date,
  ): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    await this.prisma.emailToken.deleteMany({
      where: { userId, purpose, usedAt: null },
    });
    await this.prisma.emailToken.create({
      data: {
        userId,
        purpose,
        tokenHash: hashToken(token),
        expiresAt: new Date(now.getTime() + TOKEN_TTL_MS[purpose]),
      },
    });
    const url = new URL(LINK_PATH[purpose], this.frontendUrl());
    url.searchParams.set('token', token);
    return url.toString();
  }

  /** Marks a valid token as used, or throws 400 INVALID_TOKEN. */
  private async useToken(
    token: string,
    purpose: EmailTokenPurpose,
    now: Date,
  ): Promise<{ userId: string }> {
    const entry = await this.prisma.emailToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (
      !entry ||
      entry.purpose !== purpose ||
      entry.usedAt ||
      entry.expiresAt.getTime() <= now.getTime()
    ) {
      throw invalidToken();
    }
    // Only one request can use the token, even if two arrive at once.
    const { count } = await this.prisma.emailToken.updateMany({
      where: { id: entry.id, usedAt: null },
      data: { usedAt: now },
    });
    if (count !== 1) throw invalidToken();
    return { userId: entry.userId };
  }

  private async language(userId: string): Promise<AccountEmailLanguage> {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: { language: true },
    });
    return settings?.language === 'uk' ? 'uk' : 'en';
  }

  private frontendUrl(): string {
    return (
      this.config.get<string>('FRONTEND_URL') ??
      parseCorsOrigins(
        this.config.get<string>('CORS_ORIGINS', 'http://localhost:5180'),
      )[0] ??
      'http://localhost:5180'
    );
  }
}
