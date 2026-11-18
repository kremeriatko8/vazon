import { Injectable } from '@nestjs/common';
import type { User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** Thrown by `create` when the email is already registered. */
export class EmailTakenError extends Error {
  constructor() {
    super('Email is already registered');
    this.name = 'EmailTakenError';
  }
}

/**
 * The only place that reads or writes the users table.
 * Returns full User rows (including passwordHash) for internal use;
 * callers must never send passwordHash to a client.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  /** Links an existing account to a Google account and removes its password. */
  linkGoogle(id: string, googleId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { googleId, passwordHash: null },
    });
  }

  /** passwordHash is null for accounts created through Google sign-in. */
  async create(data: {
    email: string;
    passwordHash: string | null;
    googleId?: string;
  }): Promise<User> {
    try {
      return await this.prisma.user.create({ data });
    } catch (error) {
      // P2002: unique constraint violated (two registrations raced on the same email).
      if (isUniqueViolation(error)) throw new EmailTakenError();
      throw error;
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}
