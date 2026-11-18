import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, ValidateIf } from 'class-validator';

/**
 * An optional free-text field that can be cleared.
 * Spaces are trimmed; an empty string or null is stored as null.
 */
export function OptionalText(maxLength: number): PropertyDecorator {
  return applyDecorators(
    Transform(({ value }: { value: unknown }) => {
      if (typeof value !== 'string') return value;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }),
    ValidateIf((_object, value) => value !== undefined && value !== null),
    IsString(),
    MaxLength(maxLength),
  );
}
