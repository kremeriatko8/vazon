import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  DEFAULT_SETTINGS,
  SETTINGS_FIELDS,
  type SettingsDto,
  toSettingsDto,
  type UpdateSettingsDto,
} from './dto/settings.dto.js';

/** Per-user preferences: interface language and reminders. */
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** The user's settings, or the defaults if they never saved any. Never writes. */
  async get(userId: string): Promise<SettingsDto> {
    const row = await this.prisma.userSettings.findUnique({
      where: { userId },
    });
    return row ? toSettingsDto(row) : { ...DEFAULT_SETTINGS };
  }

  /** Saves the fields that were sent; the others keep their current values. */
  async update(userId: string, dto: UpdateSettingsDto): Promise<SettingsDto> {
    const data = Object.fromEntries(
      SETTINGS_FIELDS.filter((field) => dto[field] !== undefined).map(
        (field) => [field, dto[field]],
      ),
    ) as UpdateSettingsDto;
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Send at least one setting to change');
    }
    try {
      const row = await this.prisma.userSettings.upsert({
        where: { userId },
        create: { userId, ...data },
        update: data,
      });
      return toSettingsDto(row);
    } catch (error) {
      // P2003: the token is valid but its user no longer exists.
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2003'
      ) {
        throw new UnauthorizedException();
      }
      throw error;
    }
  }
}
