import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { AuthService, INVALID_CREDENTIALS } from './auth.service.js';
import { hashPassword } from './password.js';

function createPrismaMock() {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };
}

describe('AuthService (Prisma mocked)', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let jwt: JwtService;
  let service: AuthService;

  beforeEach(() => {
    prisma = createPrismaMock();
    jwt = new JwtService({
      secret: 'unit-test-secret',
      signOptions: { expiresIn: '1h' },
    });
    service = new AuthService(
      new UsersService(prisma as unknown as PrismaService),
      jwt,
    );
  });

  describe('register', () => {
    it('creates a user with a lowercased email and a scrypt hash, and returns a token plus id and email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(
        ({ data }: { data: { email: string; passwordHash: string } }) =>
          Promise.resolve({
            id: 'user-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          }),
      );

      const result = await service.register({
        email: 'Owner@Example.COM',
        password: 'password123',
      });

      expect(result.user).toEqual({ id: 'user-1', email: 'owner@example.com' });
      expect(Object.keys(result).sort()).toEqual(['accessToken', 'user']);
      expect(JSON.stringify(result)).not.toContain('scrypt');
      const payload = await jwt.verifyAsync<Record<string, unknown>>(
        result.accessToken,
      );
      expect(payload.sub).toBe('user-1');
      expect(Object.keys(payload).sort()).toEqual(['exp', 'iat', 'sub']);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'owner@example.com' },
      });
      const { data } = prisma.user.create.mock.calls[0][0] as {
        data: { email: string; passwordHash: string };
      };
      expect(data.email).toBe('owner@example.com');
      expect(data.passwordHash).toMatch(/^scrypt\$/);
      expect(data.passwordHash).not.toContain('password123');
    });

    it('throws ConflictException when the email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'existing',
        email: 'owner@example.com',
      });
      await expect(
        service.register({
          email: 'owner@example.com',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when a concurrent insert hits the unique constraint', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockRejectedValue(
        Object.assign(new Error('Unique'), { code: 'P2002' }),
      );
      await expect(
        service.register({
          email: 'owner@example.com',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('returns a JWT whose payload contains only sub, plus the user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'owner@example.com',
        passwordHash: await hashPassword('password123'),
      });

      const { accessToken, user } = await service.login({
        email: 'OWNER@example.com',
        password: 'password123',
      });
      expect(user).toEqual({ id: 'user-1', email: 'owner@example.com' });

      const payload =
        await jwt.verifyAsync<Record<string, unknown>>(accessToken);
      expect(payload.sub).toBe('user-1');
      expect(Object.keys(payload).sort()).toEqual(['exp', 'iat', 'sub']);
    });

    it('unknown email throws the same error as a wrong password', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      const unknownEmail = await service
        .login({ email: 'nobody@example.com', password: 'password123' })
        .catch((error: unknown) => error);

      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'owner@example.com',
        passwordHash: await hashPassword('password123'),
      });
      const wrongPassword = await service
        .login({ email: 'owner@example.com', password: 'wrong-password' })
        .catch((error: unknown) => error);

      expect(unknownEmail).toBeInstanceOf(UnauthorizedException);
      expect(wrongPassword).toBeInstanceOf(UnauthorizedException);
      expect((unknownEmail as UnauthorizedException).getResponse()).toEqual(
        (wrongPassword as UnauthorizedException).getResponse(),
      );
      expect((unknownEmail as UnauthorizedException).message).toBe(
        INVALID_CREDENTIALS,
      );
    });
  });

  describe('me', () => {
    it('returns id and email only', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'owner@example.com',
        passwordHash: 'scrypt$secret$hash',
      });
      await expect(service.me('user-1')).resolves.toEqual({
        id: 'user-1',
        email: 'owner@example.com',
      });
    });

    it('throws UnauthorizedException when the user no longer exists', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.me('gone')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
