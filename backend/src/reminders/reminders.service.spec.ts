import type { ConfigService } from '@nestjs/config';
import type { CareTasksService } from '../care-schedules/care-tasks.service.js';
import type { CareTaskDto } from '../care-schedules/dto/care-task.dto.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { MailSender } from './mail.sender.js';
import { RemindersService } from './reminders.service.js';

// 10:00 in Kyiv (UTC+2 in November).
const NOW = new Date('2026-11-19T08:00:00Z');

const due: CareTaskDto = {
  plantId: 'p1',
  plantName: 'Monstera',
  species: 'Monstera deliciosa',
  taskType: 'WATER',
  lastDoneAt: null,
  nextDueDate: '2026-11-19',
  intervalDays: 7,
  status: 'TODAY',
  restPeriod: false,
  waterAmountMl: { min: 300, max: 500 },
};

function setup(
  settings: Record<string, unknown> | null,
  tasks: CareTaskDto[] = [due],
) {
  const prisma = {
    user: {
      findMany: vi
        .fn()
        .mockResolvedValue([{ id: 'u1', email: 'a@example.test', settings }]),
    },
    userSettings: { upsert: vi.fn().mockResolvedValue({}) },
  };
  const careTasks = { findForOwner: vi.fn().mockResolvedValue(tasks) };
  const mail = { send: vi.fn().mockResolvedValue('sent') };
  const config = { get: vi.fn().mockReturnValue(undefined) };
  const service = new RemindersService(
    prisma as unknown as PrismaService,
    careTasks as unknown as CareTasksService,
    mail as unknown as MailSender,
    config as unknown as ConfigService,
  );
  return { prisma, careTasks, mail, service };
}

describe('RemindersService.run', () => {
  it('sends with default settings (no row yet) and records the day', async () => {
    const { prisma, mail, service } = setup(null);
    const summary = await service.run(NOW);
    expect(summary).toMatchObject({ checked: 1, sent: 1 });
    expect(mail.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'a@example.test' }),
    );
    expect(prisma.userSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { lastReminderSentOn: '2026-11-19' } }),
    );
  });

  it('sends at most once per day', async () => {
    const { mail, service } = setup({ lastReminderSentOn: '2026-11-19' });
    expect((await service.run(NOW)).skipped).toBe(1);
    expect(mail.send).not.toHaveBeenCalled();
  });

  it('waits until the reminder time in Kyiv', async () => {
    const { mail, service } = setup({ reminderTime: '10:30' });
    await service.run(NOW);
    expect(mail.send).not.toHaveBeenCalled();
  });

  it('respects reminders and email digest switches', async () => {
    for (const off of [{ remindersEnabled: false }, { emailDigest: false }]) {
      const { mail, service } = setup(off);
      await service.run(NOW);
      expect(mail.send).not.toHaveBeenCalled();
    }
  });

  it('skips tasks that are not due, and feeding paused for winter', async () => {
    const { mail, service } = setup(null, [
      { ...due, nextDueDate: '2026-11-25', status: 'UPCOMING' },
      { ...due, taskType: 'FEED', restPeriod: true, nextDueDate: '2026-11-19' },
    ]);
    await service.run(NOW);
    expect(mail.send).not.toHaveBeenCalled();
  });

  it('includes tomorrow only with the day-before alert', async () => {
    const tomorrow = {
      ...due,
      nextDueDate: '2026-11-20',
      status: 'UPCOMING' as const,
    };
    const off = setup(null, [tomorrow]);
    await off.service.run(NOW);
    expect(off.mail.send).not.toHaveBeenCalled();
    const on = setup({ dayBeforeAlert: true }, [tomorrow]);
    await on.service.run(NOW);
    expect(on.mail.send).toHaveBeenCalledTimes(1);
  });

  it('does not record the day when sending fails', async () => {
    const { prisma, mail, service } = setup(null);
    mail.send.mockRejectedValue(new Error('Brevo answered 401'));
    const summary = await service.run(NOW);
    expect(summary.failed).toBe(1);
    expect(prisma.userSettings.upsert).not.toHaveBeenCalled();
  });
});
