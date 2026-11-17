import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '../generated/prisma/client.js';
import { EmailTakenError, UsersService } from '../users/users.service.js';
import type { AccessTokenDto, AuthUserDto } from './dto/auth-responses.dto.js';
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

  async register(dto: RegisterDto): Promise<AuthUserDto> {
    const email = normalizeEmail(dto.email);
    if (await this.users.findByEmail(email)) {
      throw new ConflictException(EMAIL_TAKEN);
    }

    try {
      const user = await this.users.create({
        email,
        passwordHash: await hashPassword(dto.password),
      });
      return toAuthUser(user);
    } catch (error) {
      if (error instanceof EmailTakenError)
        throw new ConflictException(EMAIL_TAKEN);
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AccessTokenDto> {
    const user = await this.users.findByEmail(normalizeEmail(dto.email));
    if (!user) {
      this.dummyHash ??= hashPassword('vazon-dummy-password');
      await verifyPassword(dto.password, await this.dummyHash);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    if (!(await verifyPassword(dto.password, user.passwordHash))) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const payload: JwtPayload = { sub: user.id };
    return { accessToken: await this.jwt.signAsync(payload) };
  }

  async me(userId: string): Promise<AuthUserDto> {
    const user = await this.users.findById(userId);
    // A valid token for a deleted user is treated as an invalid token.
    if (!user) throw new UnauthorizedException();
    return toAuthUser(user);
  }
}

function normalizeEmail(email: string): string {
  return email.toLowerCase();
}

function toAuthUser(user: User): AuthUserDto {
  return { id: user.id, email: user.email };
}
