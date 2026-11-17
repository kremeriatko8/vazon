import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp, setupSwagger, SWAGGER_PATH } from './app.setup.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  setupSwagger(app);

  const port = app.get(ConfigService).get<number>('PORT', 3100);
  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`Vazon API listening on http://localhost:${port}/api/v1`);
  logger.log(`Swagger docs at http://localhost:${port}/${SWAGGER_PATH}`);
}

await bootstrap();
