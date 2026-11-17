import type { PrismaService } from '../prisma/prisma.service.js';
import { EmailTakenError, UsersService } from './users.service.js';

function createPrismaMock() {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };
}

describe('UsersService (Prisma mocked)', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: UsersService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new UsersService(prisma as unknown as PrismaService);
  });

  it('findByEmail queries by the unique email', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.findByEmail('a@example.com')).resolves.toBeNull();
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'a@example.com' },
    });
  });

  it('findById queries by id', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await service.findById('user-1');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
  });

  it('create passes email and passwordHash to Prisma', async () => {
    const user = {
      id: 'user-1',
      email: 'a@example.com',
      passwordHash: 'scrypt$x$y',
    };
    prisma.user.create.mockResolvedValue(user);
    await expect(
      service.create({ email: 'a@example.com', passwordHash: 'scrypt$x$y' }),
    ).resolves.toBe(user);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { email: 'a@example.com', passwordHash: 'scrypt$x$y' },
    });
  });

  it('create turns a unique-constraint error (P2002) into EmailTakenError', async () => {
    prisma.user.create.mockRejectedValue(
      Object.assign(new Error('Unique'), { code: 'P2002' }),
    );
    await expect(
      service.create({ email: 'a@example.com', passwordHash: 'h' }),
    ).rejects.toBeInstanceOf(EmailTakenError);
  });

  it('create rethrows other errors unchanged', async () => {
    const failure = new Error('connection lost');
    prisma.user.create.mockRejectedValue(failure);
    await expect(
      service.create({ email: 'a@example.com', passwordHash: 'h' }),
    ).rejects.toBe(failure);
  });
});
