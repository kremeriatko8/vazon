import type { PrismaService } from '../prisma/prisma.service.js';
import { FeedbackService } from './feedback.service.js';

const USER = '11111111-1111-4111-8111-111111111111';
const dto = {
  category: 'BUG' as const,
  message: 'Button overflows',
  page: '/plants',
};

describe('FeedbackService (Prisma mocked)', () => {
  let prisma: { feedback: { create: ReturnType<typeof vi.fn> } };
  let service: FeedbackService;

  beforeEach(() => {
    prisma = { feedback: { create: vi.fn().mockResolvedValue({ id: 'f1' }) } };
    service = new FeedbackService(prisma as unknown as PrismaService);
  });

  it('stores feedback linked to the signed-in user', async () => {
    await service.create(dto, { userId: USER, userAgent: 'Firefox' });
    expect(prisma.feedback.create).toHaveBeenCalledWith({
      data: {
        category: 'BUG',
        message: 'Button overflows',
        page: '/plants',
        userAgent: 'Firefox',
        userId: USER,
      },
    });
  });

  it('stores anonymous feedback without page or user agent as nulls', async () => {
    await service.create({ category: 'IDEA', message: 'Dark mode' }, {});
    expect(prisma.feedback.create).toHaveBeenCalledWith({
      data: {
        category: 'IDEA',
        message: 'Dark mode',
        page: null,
        userAgent: null,
        userId: null,
      },
    });
  });

  it('cuts a very long user agent to 300 characters', async () => {
    await service.create(dto, { userAgent: 'x'.repeat(1000) });
    const call = prisma.feedback.create.mock.calls[0]?.[0] as {
      data: { userAgent: string };
    };
    expect(call.data.userAgent).toHaveLength(300);
  });

  it('keeps the feedback anonymously when the user no longer exists', async () => {
    prisma.feedback.create
      .mockRejectedValueOnce(Object.assign(new Error('FK'), { code: 'P2003' }))
      .mockResolvedValueOnce({ id: 'f2' });
    await expect(service.create(dto, { userId: USER })).resolves.toEqual({
      id: 'f2',
    });
    const retry = prisma.feedback.create.mock.calls[1]?.[0] as {
      data: { userId: string | null };
    };
    expect(retry.data.userId).toBeNull();
  });

  it('rethrows other database errors', async () => {
    const failure = new Error('connection lost');
    prisma.feedback.create.mockRejectedValue(failure);
    await expect(service.create(dto, { userId: USER })).rejects.toBe(failure);
    expect(prisma.feedback.create).toHaveBeenCalledTimes(1);
  });
});
