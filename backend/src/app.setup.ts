import type { ServerResponse } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';
import { parseCorsOrigins } from './config/env.validation.js';
import {
  resolveUploadsDir,
  UPLOADS_URL_PREFIX,
} from './plants/photos/photo-storage.service.js';

export const API_PREFIX = 'api/v1';
export const SWAGGER_PATH = `${API_PREFIX}/docs`;

/**
 * Applies global settings to the Nest application.
 * Shared by main.ts and the e2e tests so both run with identical behaviour.
 */
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);

  app.setGlobalPrefix(API_PREFIX);
  // Behind Render's proxy, the client IP (used by the rate limit) is in X-Forwarded-For.
  if (config.get<string>('NODE_ENV') === 'production') {
    (app as NestExpressApplication).set('trust proxy', 1);
  }
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties without decorators
      forbidNonWhitelisted: true, // reject requests that send unknown properties
      transform: true, // turn plain JSON into DTO class instances
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: parseCorsOrigins(
      config.get<string>('CORS_ORIGINS', 'http://localhost:5180'),
    ),
    credentials: true,
  });
  app.enableShutdownHooks();
  serveUploadedPhotos(app, config);
}

/**
 * Serves saved plant photos as static files at /api/v1/uploads/<key>.
 * Names are random and unguessable, so no token is needed (an <img> tag
 * cannot send one). Unknown names fall through to the normal JSON 404.
 */
function serveUploadedPhotos(
  app: INestApplication,
  config: ConfigService,
): void {
  (app as NestExpressApplication).useStaticAssets(
    resolveUploadsDir(config.get<string>('UPLOADS_DIR')),
    {
      prefix: UPLOADS_URL_PREFIX,
      index: false,
      dotfiles: 'deny',
      // A key never changes its content: a new photo gets a new key.
      maxAge: '30d',
      immutable: true,
      setHeaders: (res: ServerResponse) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'none'");
        // Lets the frontend on another port or domain show the image.
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    },
  );
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
