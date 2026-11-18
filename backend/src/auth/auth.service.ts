import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '../generated/prisma/client.js';
import { EmailTakenError, UsersService } from '../users/users.service.js';
import {
  type GoogleProfile,
  GoogleSignInError,
} from './google-oauth.service.js';
import type { AuthResponseDto, AuthUserDto } from './dto/auth-responses.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import { hashPassword, verifyPassword } from './password.js';

/** Same message for unknown email and wrong password, so accounts cannot be enumerated. */
export const INVALID_CREDENTIALS = 'Invalid email or password';
export const EMAIL_TAKEN = 'Email is already registered';

export interface JwtPayload {
  sub: string;
}

@Injectable()
export class AuthService {
  /** Compared against when the email is unknown, so both failure paths take similar time. */
  private dummyHash?: Promise<string>;

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const email = normalizeEmail(dto.email);
    if (await this.users.findByEmail(email)) {
      throw new ConflictException(EMAIL_TAKEN);
    }

    let user: User;
    try {
      user = await this.users.create({
        email,
        passwordHash: await hashPassword(dto.password),
      });
    } catch (error) {
      if (error instanceof EmailTakenError)
        throw new ConflictException(EMAIL_TAKEN);
      throw error;
    }
    return this.issueToken(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.users.findByEmail(normalizeEmail(dto.email));
    // Google-only accounts have no password; they fail like an unknown email.
    if (!user?.passwordHash) {
      this.dummyHash ??= hashPassword('vazon-dummy-password');
      await verifyPassword(dto.password, await this.dummyHash);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    if (!(await verifyPassword(dto.password, user.passwordHash))) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    return this.issueToken(user);
  }

  /**
   * Signs in with a Google account: by Google id, else by email, else a new
   * account without a password.
   *
   * Linking by email drops the existing password. Registration does not verify
   * email ownership, so anyone could have registered this address first; Google
   * has verified it. Without this, that person would keep access to the account.
   */
  async signInWithGoogle(profile: GoogleProfile): Promise<AuthResponseDto> {
    if (!profile.emailVerified) {
      throw new GoogleSignInError('email_not_verified');
    }
    const linked = await this.users.findByGoogleId(profile.sub);
    if (linked) return this.issueToken(linked);

    const email = normalizeEmail(profile.email);
    const existing = await this.users.findByEmail(email);
    if (existing) {
      if (existing.googleId) throw new GoogleSignInError('account_conflict');
      return this.issueToken(
        await this.users.linkGoogle(existing.id, profile.sub),
      );
    }

    try {
      return this.issueToken(
        await this.users.create({
          email,
          passwordHash: null,
          googleId: profile.sub,
        }),
      );
    } catch (error) {
      // Two sign-ins raced; the other one created the account.
      if (error instanceof EmailTakenError) {
        const created = await this.users.findByGoogleId(profile.sub);
        if (created) return this.issueToken(created);
      }
      throw error;
    }
  }

  async me(userId: string): Promise<AuthUserDto> {
    const user = await this.users.findById(userId);
    // A valid token for a deleted user is treated as an invalid token.
    if (!user) throw new UnauthorizedException();
    return toAuthUser(user);
  }

  /** Signs the access token used by both register and login. */
  private async issueToken(user: User): Promise<AuthResponseDto> {
    const payload: JwtPayload = { sub: user.id };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: toAuthUser(user),
    };
  }
}

function normalizeEmail(email: string): string {
  return email.toLowerCase();
}

function toAuthUser(user: User): AuthUserDto {
  return { id: user.id, email: user.email };
}
