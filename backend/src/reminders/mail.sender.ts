import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export type MailResult = 'sent' | 'logged';

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Sends email through the Brevo HTTP API (free plan: 300 emails a day).
 * Without BREVO_API_KEY and MAIL_FROM it only logs the message, so local
 * development and tests never send real email.
 */
@Injectable()
export class MailSender {
  private readonly logger = new Logger(MailSender.name);

  constructor(private readonly config: ConfigService) {}

  get isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('BREVO_API_KEY') &&
      this.config.get<string>('MAIL_FROM'),
    );
  }

  async send(message: MailMessage): Promise<MailResult> {
    if (!this.isConfigured) {
      this.logger.log(
        `Email not sent (BREVO_API_KEY or MAIL_FROM missing): "${message.subject}"`,
      );
      return 'logged';
    }
    const response = await fetch(BREVO_URL, {
      method: 'POST',
      headers: {
        'api-key': this.config.get<string>('BREVO_API_KEY') ?? '',
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: {
          email: this.config.get<string>('MAIL_FROM'),
          name: this.config.get<string>('MAIL_FROM_NAME', 'Vazon'),
        },
        to: [{ email: message.to }],
        subject: message.subject,
        textContent: message.text,
        htmlContent: message.html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`Brevo answered ${response.status}`);
    }
    return 'sent';
  }
}
