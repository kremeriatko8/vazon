import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, Length } from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class AccountDto {
  @ApiProperty({ example: 'owner@example.com' })
  email!: string;

  @ApiProperty({
    example: false,
    description: 'True after the email link was opened, or for Google accounts',
  })
  emailVerified!: boolean;

  @ApiProperty({ description: 'False for accounts created with Google only' })
  hasPassword!: boolean;

  @ApiProperty()
  googleLinked!: boolean;

  @ApiProperty({ example: '2026-11-18T09:30:00.000Z' })
  createdAt!: string;
}

/** A token from an emailed link. */
export class TokenDto {
  @ApiProperty({ description: 'The token from the link in the email' })
  @Transform(trim)
  @IsString()
  @Length(20, 200)
  token!: string;
}

/** Interface language for the email; without it the saved setting (or English) is used. */
export class EmailLanguageDto {
  @ApiPropertyOptional({ enum: ['en', 'uk'] })
  @IsOptional()
  @IsIn(['en', 'uk'])
  language?: 'en' | 'uk';
}

export class PasswordResetRequestDto extends EmailLanguageDto {
  @ApiProperty({ example: 'owner@example.com' })
  @Transform(trim)
  @IsEmail()
  email!: string;
}

export class PasswordResetConfirmDto extends TokenDto {
  @ApiProperty({
    example: 'a-new-strong-password',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @Length(8, 72)
  password!: string;
}

export class DeleteAccountDto {
  @ApiProperty({
    example: 'owner@example.com',
    description: "The account's email, typed again to confirm",
  })
  @Transform(trim)
  @IsEmail()
  confirmEmail!: string;
}
