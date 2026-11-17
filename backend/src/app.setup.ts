import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';
import { parseCorsOrigins } from './config/env.validation.js';

export const API_PREFIX = 'api/v1';
export const SWAGGER_PATH = `${API_PREFIX}/docs`;

/**
 * Applies global settings to the Nest application.
 * Shared by main.ts and the e2e tests so both run with identical behaviour.
 */
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);

  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties without decorators
      forbidNonWhitelisted: true, // reject requests that send unknown properties
      transform: true, // turn plain JSON into DTO class instances
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: parseCorsOrigins(config.get<string>('CORS_ORIGINS', 'http://localhost:5180')),
    credentials: true,
  });
  app.enableShutdownHooks();
}

export function setupSwagger(app: INestApplication): void {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Vazon API')
      .setDescription(
        'REST API for Vazon, houseplant care without the guesswork. ' +
          'Endpoints marked "Draft" have an agreed contract but return 501 until implemented.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup(SWAGGER_PATH, app, document);
}
