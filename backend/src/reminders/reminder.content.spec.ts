import type { CareTaskDto } from '../care-schedules/dto/care-task.dto.js';
import { buildReminderEmail } from './reminder.content.js';

const task = (over: Partial<CareTaskDto>): CareTaskDto => ({
  plantId: 'p1',
  plantName: 'Monstera',
  species: 'Monstera deliciosa',
  taskType: 'WATER',
  lastDoneAt: null,
  nextDueDate: '2026-11-19',
  intervalDays: 7,
  status: 'TODAY',
  restPeriod: false,
  waterNeed: 'MEDIUM',
  waterNeedSource: 'CATALOG',
  personalFactor: 1,
  learnedCycles: 0,
  waterAmountMl: { min: 300, max: 500 },
  ...over,
});

describe('buildReminderEmail', () => {
  it('returns null when nothing is due', () => {
    expect(
      buildReminderEmail('en', [], '2026-11-19', '2026-11-20', undefined),
    ).toBeNull();
  });

  it('lists tasks in Ukrainian with the water amount and a link', () => {
    const email = buildReminderEmail(
      'uk',
      [
        task({}),
        task({ plantId: 'p2', plantName: 'Кактус', nextDueDate: '2026-11-15' }),
      ],
      '2026-11-19',
      '2026-11-20',
      'https://vazon-web.onrender.com/',
    )!;
    expect(email.subject).toContain('2');
    expect(email.text).toContain(
      'Monstera: Полити, сьогодні (приблизно 300–500 мл)',
    );
    expect(email.text).toContain('Кактус: Полити, прострочено з 2026-11-15');
    expect(email.text).toContain('https://vazon-web.onrender.com/tasks');
  });

  it('escapes plant names in HTML', () => {
    const email = buildReminderEmail(
      'en',
      [
        task({
          plantName: '<b>x</b>',
          taskType: 'FEED',
          waterAmountMl: undefined,
        }),
      ],
      '2026-11-19',
      '2026-11-20',
      undefined,
    )!;
    expect(email.html).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(email.html).not.toContain('<b>x</b>');
    expect(email.subject).toBe('Vazon: 1 plant needs care');
  });
});
