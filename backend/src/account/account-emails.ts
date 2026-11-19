export type AccountEmailLanguage = 'en' | 'uk';

export interface AccountEmail {
  subject: string;
  text: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function build(
  lines: { intro: string; button: string; after: string; subject: string },
  link: string,
): AccountEmail {
  return {
    subject: lines.subject,
    text: `${lines.intro}\n\n${lines.button}: ${link}\n\n${lines.after}`,
    html: [
      `<p>${escapeHtml(lines.intro)}</p>`,
      `<p><a href="${escapeHtml(link)}">${escapeHtml(lines.button)}</a></p>`,
      `<p style="color:#777;font-size:12px">${escapeHtml(lines.after)}</p>`,
    ].join('\n'),
  };
}

export function verificationEmail(
  language: AccountEmailLanguage,
  link: string,
): AccountEmail {
  return build(
    language === 'uk'
      ? {
          subject: 'Vazon: підтвердіть пошту',
          intro:
            'Підтвердіть, будь ласка, що це ваша пошта. Після цього Vazon зможе надсилати нагадування про догляд.',
          button: 'Підтвердити пошту',
          after:
            'Посилання діє 24 години. Якщо ви не реєструвалися у Vazon, просто проігноруйте цей лист.',
        }
      : {
          subject: 'Vazon: confirm your email',
          intro:
            'Please confirm this is your email address. Then Vazon can send you care reminders.',
          button: 'Confirm email',
          after:
            'The link works for 24 hours. If you did not sign up for Vazon, ignore this email.',
        },
    link,
  );
}

export function passwordResetEmail(
  language: AccountEmailLanguage,
  link: string,
): AccountEmail {
  return build(
    language === 'uk'
      ? {
          subject: 'Vazon: новий пароль',
          intro: 'Хтось попросив змінити пароль до вашого акаунта Vazon.',
          button: 'Задати новий пароль',
          after:
            'Посилання діє 1 годину. Якщо це були не ви, нічого не робіть: пароль залишиться тим самим.',
        }
      : {
          subject: 'Vazon: set a new password',
          intro: 'Someone asked to change the password of your Vazon account.',
          button: 'Set a new password',
          after:
            'The link works for 1 hour. If it was not you, do nothing: your password stays the same.',
        },
    link,
  );
}
