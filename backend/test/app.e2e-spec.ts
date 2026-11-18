import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import type { ErrorResponseBody } from '../src/common/filters/http-exception.filter.js';
import type { HealthResponseDto } from '../src/health/health-response.dto.js';

/**
 * Boots the real AppModule with the same global setup as main.ts
 * (prefix /api/v1, validation pipe, error filter, CORS).
 * No database is needed: Prisma connects lazily and these routes do not query it.
 */
describe('Vazon API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns status ok', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
    const body = response.body as HealthResponseDto;
    expect(body).toMatchObject({ status: 'ok', service: 'vazon-backend' });
    expect(typeof body.timestamp).toBe('string');
  });

  it('GET /health without the /api/v1 prefix is not found', async () => {
    await request(app.getHttpServer()).get('/health').expect(404);
  });

  it('unknown routes return the shared JSON error shape', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/does-not-exist')
      .expect(404);
    const body = response.body as ErrorResponseBody;
    expect(body).toMatchObject({
      statusCode: 404,
      path: '/api/v1/does-not-exist',
    });
    expect(typeof body.timestamp).toBe('string');
  });

  it('allows CORS requests from the frontend origin', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:5180')
      .expect(200);
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:5180',
    );
  });
});
