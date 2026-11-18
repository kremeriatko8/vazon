import { plainToInstance, Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

/**
 * Every environment variable the backend reads. The app refuses to start
 * when a required variable is missing or malformed, which is easier to debug
 * than a failure deep inside a request.
 */
export class EnvironmentVariables {
  @IsIn(['development', 'test', 'production'])
  @IsOptional()
  NODE_ENV: 'development' | 'test' | 'production' = 'development';

  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT: number = 3100;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  /** Comma-separated list of origins allowed to call the API from a browser. */
  @IsString()
  @IsOptional()
  CORS_ORIGINS: string = 'http://localhost:5180';

  /** Folder for uploaded plant photos. Relative paths start at the backend folder. */
  @IsString()
  @IsOptional()
  UPLOADS_DIR: string = 'uploads';

  /** Google sign-in. Without the client id and secret, /auth/google reports it is not configured. */
  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_SECRET?: string;

  /** Must match a redirect URI of the Google OAuth client exactly. */
  @IsString()
  @IsOptional()
  GOOGLE_CALLBACK_URL: string =
    'http://localhost:3100/api/v1/auth/google/callback';

  /** Where the browser returns after Google sign-in. Defaults to the first CORS origin. */
  @IsString()
  @IsOptional()
  FRONTEND_URL?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return validated;
}

export function parseCorsOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}
