import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CareTasksService } from '../care-schedules/care-tasks.service.js';
import { kyivDateString } from '../care-schedules/schedule.engine.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DEFAULT_SETTINGS } from '../settings/dto/settings.dto.js';
import { MailSender } from '../mail/mail.sender.js';
import { buildReminderEmail } from './reminder.content.js';

export interface ReminderRunSummary {
  checked: number;
  sent: number;
  logged: number;
  skipped: number;
  failed: number;
}

const KYIV_TIME = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Kyiv',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/**
 * Daily reminder emails. Meant to be called every 15–30 minutes: a user gets
 * one email per Europe/Kyiv day, at the first run after their reminder time,
 * and only when something is due (today, overdue, or tomorrow with
 * "day before" on). Feeding paused for the winter is never included.
 */
@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly careTasks: CareTasksService,
    private readonly mail: MailSender,
    private readonly config: ConfigService,
  ) {}

  async run(now = new Date()): Promise<ReminderRunSummary> {
    const today = kyivDateString(now);
    const tomorrow = kyivDateString(new Date(now.getTime() + 86_400_000));
    const time = KYIV_TIME.format(now);
    const summary: ReminderRunSummary = {
      checked: 0,
      sent: 0,
      logged: 0,
      skipped: 0,
      failed: 0,
    };

    const users = await this.prisma.user.findMany({
      // Only confirmed addresses (or Google accounts), so we never email a stranger.
      where: {
        plants: { some: { status: { not: 'DEAD' } } },
        OR: [{ emailVerifiedAt: { not: null } }, { googleId: { not: null } }],
      },
      select: { id: true, email: true, settings: true },
    });

    for (const user of users) {
      summary.checked += 1;
      const settings = { ...DEFAULT_SETTINGS, ...(user.settings ?? {}) };
      const lastSent = user.settings?.lastReminderSentOn ?? null;
      if (
        !settings.remindersEnabled ||
        !settings.emailDigest ||
        time < settings.reminderTime ||
        lastSent === today
      ) {
        summary.skipped += 1;
        continue;
      }

      const tasks = (await this.careTasks.findForOwner(user.id, now)).filter(
        (task) =>
          !task.restPeriod &&
          (task.nextDueDate <= today ||
            (settings.dayBeforeAlert && task.nextDueDate === tomorrow)),
      );
      const email = buildReminderEmail(
        settings.language === 'uk' ? 'uk' : 'en',
        tasks,
        today,
        tomorrow,
        this.config.get<string>('FRONTEND_URL'),
      );
      if (!email) {
        summary.skipped += 1;
        continue;
      }

      try {
        const result = await this.mail.send({ to: user.email, ...email });
        summary[result] += 1;
        await this.prisma.userSettings.upsert({
          where: { userId: user.id },
          create: { userId: user.id, lastReminderSentOn: today },
          update: { lastReminderSentOn: today },
        });
      } catch (error) {
        summary.failed += 1;
        this.logger.error(
          `Reminder for user ${user.id} failed`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
    this.logger.log(`Reminder run: ${JSON.stringify(summary)}`);
    return summary;
  }
}
