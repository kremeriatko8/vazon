import { BadRequestException, ConflictException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { MailSender } from '../mail/mail.sender.js';
import type { PhotoStorageService } from '../plants/photos/photo-storage.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AccountService, hashToken } from './account.service.js';

const NOW = new Date('2026-11-19T10:00:00Z');
const user = {
  id: 'u1',
  email: 'owner@example.com',
  passwordHash: 'hash',
  googleId: null as string | null,
  emailVerifiedAt: null as Date | null,
  createdAt: new Date('2026-11-01T10:00:00Z'),
};

function setup(overrides: Partial<typeof user> = {}) {
  const prisma = {
    user: {
      findUnique: vi.fn().mockResolvedValue({ ...user, ...overrides }),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    },
    emailToken: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    userSettings: { findUnique: vi.fn().mockResolvedValue({ language: 'uk' }) },
    plant: { findMany: vi.fn().mockResolvedValue([{ photoKey: 'a.jpg' }]) },
  };
  const mail = { send: vi.fn().mockResolvedValue('logged') };
  const config = {
    get: vi.fn((key: string, fallback?: string) =>
      key === 'FRONTEND_URL' ? 'https://vazon-web.onrender.com' : fallback,
    ),
  };
  const photos = { remove: vi.fn().mockResolvedValue(undefined) };
  const service = new AccountService(
    prisma as unknown as PrismaService,
    mail as unknown as MailSender,
    config as unknown as ConfigService,
    photos as unknown as PhotoStorageService,
  );
  return { prisma, mail, photos, service };
}

describe('AccountService', () => {
  it('emails a verification link in the user language and stores only a hash', async () => {
    const { prisma, mail, service } = setup();
    await service.sendVerification('u1', undefined, NOW);
    const sent = mail.send.mock.calls[0][0] as {
      to: string;
      subject: string;
      text: string;
    };
    expect(sent.to).toBe('owner@example.com');
    expect(sent.subject).toBe('Vazon: підтвердіть пошту');
    const token = /token=([A-Za-z0-9_-]+)/.exec(sent.text)![1];
    expect(sent.text).toContain(
      'https://vazon-web.onrender.com/verify-email?token=',
    );
    const stored = prisma.emailToken.create.mock.calls[0][0] as {
      data: { tokenHash: string; expiresAt: Date; purpose: string };
    };
    expect(stored.data.tokenHash).toBe(hashToken(token));
    expect(stored.data.tokenHash).not.toContain(token);
    expect(stored.data.purpose).toBe('VERIFY_EMAIL');
    expect(stored.data.expiresAt.getTime() - NOW.getTime()).toBe(
      24 * 3_600_000,
    );
  });

  it('does not send when already verified (Google counts as verified)', async () => {
    const { mail, service } = setup({ googleId: 'g1' });
    await expect(service.sendVerification('u1', undefined, NOW)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(mail.send).not.toHaveBeenCalled();
  });

  it('confirms a valid token once', async () => {
    const { prisma, service } = setup();
    prisma.emailToken.findUnique.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      purpose: 'VERIFY_EMAIL',
      usedAt: null,
      expiresAt: new Date(NOW.getTime() + 1000),
    });
    await service.confirmVerification('x'.repeat(43), NOW);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { emailVerifiedAt: NOW },
    });
  });

  it.each([
    ['unknown', null],
    [
      'expired',
      {
        id: 't',
        userId: 'u1',
        purpose: 'VERIFY_EMAIL',
        usedAt: null,
        expiresAt: NOW,
      },
    ],
    [
      'used',
      {
        id: 't',
        userId: 'u1',
        purpose: 'VERIFY_EMAIL',
        usedAt: NOW,
        expiresAt: new Date(NOW.getTime() + 1000),
      },
    ],
    [
      'other purpose',
      {
        id: 't',
        userId: 'u1',
        purpose: 'RESET_PASSWORD',
        usedAt: null,
        expiresAt: new Date(NOW.getTime() + 1000),
      },
    ],
  ])('rejects a %s token with 400 INVALID_TOKEN', async (_label, entry) => {
    const { prisma, service } = setup();
    prisma.emailToken.findUnique.mockResolvedValue(entry);
    await expect(
      service.confirmVerification('x'.repeat(43), NOW),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('password reset: silent for unknown emails', async () => {
    const { prisma, mail, service } = setup();
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.requestPasswordReset('nobody@example.com', NOW),
    ).resolves.toBeUndefined();
    expect(mail.send).not.toHaveBeenCalled();
  });

  it('password reset: sets the password and confirms the email', async () => {
    const { prisma, service } = setup();
    prisma.emailToken.findUnique.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      purpose: 'RESET_PASSWORD',
      usedAt: null,
      expiresAt: new Date(NOW.getTime() + 1000),
    });
    await service.confirmPasswordReset('x'.repeat(43), 'new-password-1', NOW);
    const data = (
      prisma.user.update.mock.calls[0][0] as {
        data: { passwordHash: string; emailVerifiedAt: Date };
      }
    ).data;
    expect(data.passwordHash).not.toBe('new-password-1');
    expect(data.emailVerifiedAt).toBe(NOW);
  });

  it('deletes the account only with the right email, and removes photo files', async () => {
    const { prisma, photos, service } = setup();
    await expect(
      service.delete('u1', 'other@example.com'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.delete).not.toHaveBeenCalled();
    await service.delete('u1', ' Owner@Example.com ');
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
    expect(photos.remove).toHaveBeenCalledWith('a.jpg');
  });
});
