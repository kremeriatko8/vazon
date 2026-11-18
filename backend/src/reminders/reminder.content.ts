import type { CareTaskDto } from '../care-schedules/dto/care-task.dto.js';

export type ReminderLanguage = 'en' | 'uk';

export interface ReminderEmail {
  subject: string;
  text: string;
  html: string;
}

const TEXT = {
  en: {
    subject: (n: number) =>
      n === 1 ? 'Vazon: 1 plant needs care' : `Vazon: ${n} plants need care`,
    intro: 'Your plants for today:',
    overdue: 'overdue since',
    today: 'today',
    tomorrow: 'tomorrow',
    water: 'Water',
    feed: 'Feed',
    amount: (min: number, max: number) => `about ${min}–${max} ml`,
    open: 'Open Vazon',
    footer:
      'You get this email because reminders are on. Turn them off in Vazon > Settings.',
  },
  uk: {
    subject: (n: number) =>
      n === 1
        ? 'Vazon: 1 рослина потребує догляду'
        : `Vazon: рослин, що потребують догляду: ${n}`,
    intro: 'Ваші рослини на сьогодні:',
    overdue: 'прострочено з',
    today: 'сьогодні',
    tomorrow: 'завтра',
    water: 'Полити',
    feed: 'Підживити',
    amount: (min: number, max: number) => `приблизно ${min}–${max} мл`,
    open: 'Відкрити Vazon',
    footer:
      'Ви отримали цей лист, бо нагадування увімкнені. Вимкнути їх можна у Vazon > Налаштування.',
  },
} as const;

/** Escapes text for HTML, since plant names are typed by users. */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * The daily reminder for the given tasks, or null when there is nothing to
 * remind about. `today` and `tomorrow` are "YYYY-MM-DD" in Europe/Kyiv.
 */
export function buildReminderEmail(
  language: ReminderLanguage,
  tasks: readonly CareTaskDto[],
  today: string,
  tomorrow: string,
  frontendUrl: string | undefined,
): ReminderEmail | null {
  if (tasks.length === 0) return null;
  const t = TEXT[language];
  const plants = new Set(tasks.map((task) => task.plantId)).size;

  const lines = tasks.map((task) => {
    const action = task.taskType === 'WATER' ? t.water : t.feed;
    const when =
      task.nextDueDate < today
        ? `${t.overdue} ${task.nextDueDate}`
        : task.nextDueDate === tomorrow
          ? t.tomorrow
          : t.today;
    const amount = task.waterAmountMl
      ? ` (${t.amount(task.waterAmountMl.min, task.waterAmountMl.max)})`
      : '';
    return { plant: task.plantName, rest: `${action}, ${when}${amount}` };
  });

  const link = frontendUrl ? `${frontendUrl.replace(/\/$/, '')}/tasks` : null;
  const text = [
    t.intro,
    '',
    ...lines.map((line) => `- ${line.plant}: ${line.rest}`),
    '',
    ...(link ? [`${t.open}: ${link}`, ''] : []),
    t.footer,
  ].join('\n');

  const html = [
    `<p>${escapeHtml(t.intro)}</p>`,
    '<ul>',
    ...lines.map(
      (line) =>
        `<li><strong>${escapeHtml(line.plant)}</strong>: ${escapeHtml(line.rest)}</li>`,
    ),
    '</ul>',
    link
      ? `<p><a href="${escapeHtml(link)}">${escapeHtml(t.open)}</a></p>`
      : '',
    `<p style="color:#777;font-size:12px">${escapeHtml(t.footer)}</p>`,
  ].join('\n');

  return { subject: t.subject(plants), text, html };
}
