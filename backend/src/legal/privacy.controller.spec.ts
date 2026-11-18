import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { LegalModule } from './legal.module.js';

describe('GET /api/v1/privacy', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LegalModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the privacy policy as HTML without a token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/privacy')
      .expect(200)
      .expect('Content-Type', /text\/html/);
    expect(response.text).toContain('Vazon privacy policy');
    expect(response.text).toContain('Політика конфіденційності Vazon');
  });
});
