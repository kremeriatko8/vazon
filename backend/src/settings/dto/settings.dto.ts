import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Language } from '../../generated/prisma/enums.js';

/** "HH:MM", 24-hour, 00:00–23:59. */
export const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/;

/** The settings object from docs/api.md. */
export class SettingsDto {
  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Sofiia',
    description: 'How the app greets the user; null means not set',
  })
  displayName!: string | null;

  @ApiProperty({ enum: Language, example: Language.uk })
  language!: Language;

  @ApiProperty({ example: true })
  remindersEnabled!: boolean;

  @ApiProperty({
    example: '09:00',
    description: 'Local time in Europe/Kyiv, "HH:MM" (24-hour)',
  })
  reminderTime!: string;

  @ApiProperty({ example: false })
  dayBeforeAlert!: boolean;

  @ApiProperty({ example: true })
  emailDigest!: boolean;
}

/** Values for a user who never saved settings. Match the schema defaults. */
export const DEFAULT_SETTINGS: SettingsDto = {
  displayName: null,
  language: Language.en,
  remindersEnabled: true,
  reminderTime: '09:00',
  dayBeforeAlert: false,
  emailDigest: true,
};

/** Validate only when sent; null is not skipped, so it fails the type check. */
const whenSent = ValidateIf((_object, value) => value !== undefined);

/** Body of PATCH /api/v1/me/settings. Only the fields that are sent change. */
export class UpdateSettingsDto {
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: 50,
    description: 'Spaces are trimmed; an empty string or null clears it',
  })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(50)
  displayName?: string | null;

  @ApiPropertyOptional({ enum: Language })
  @whenSent
  @IsEnum(Language)
  language?: Language;

  @ApiPropertyOptional()
  @whenSent
  @IsBoolean()
  remindersEnabled?: boolean;

  @ApiPropertyOptional({ example: '08:30' })
  @whenSent
  @Matches(TIME_OF_DAY, {
    message: 'reminderTime must be "HH:MM" (00:00–23:59)',
  })
  reminderTime?: string;

  @ApiPropertyOptional()
  @whenSent
  @IsBoolean()
  dayBeforeAlert?: boolean;

  @ApiPropertyOptional()
  @whenSent
  @IsBoolean()
  emailDigest?: boolean;
}

export const SETTINGS_FIELDS = [
  'displayName',
  'language',
  'remindersEnabled',
  'reminderTime',
  'dayBeforeAlert',
  'emailDigest',
] as const satisfies ReadonlyArray<keyof SettingsDto>;

export function toSettingsDto(row: SettingsDto): SettingsDto {
  return Object.fromEntries(
    SETTINGS_FIELDS.map((field) => [field, row[field]]),
  ) as unknown as SettingsDto;
}
