import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { configureApp } from '../app.setup.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SpeciesModule } from './species.module.js';

const MONSTERA = {
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  scientificName: 'Monstera Deliciosa',
  commonName: 'Swiss Cheese Plant',
  recommendedLight: 'BRIGHT_INDIRECT',
  photoUrl: null,
  photoAttribution: null,
  createdAt: new Date('2026-11-18T09:00:00.000Z'),
  updatedAt: new Date('2026-11-18T09:00:00.000Z'),
};

describe('SpeciesController (HTTP, Prisma mocked)', () => {
  let app: INestApplication<App>;
  const prisma = {
    species: {
      findMany: vi.fn(() => Promise.resolve([MONSTERA])),
      findUnique: vi.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve(where.id === MONSTERA.id ? MONSTERA : null),
      ),
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ CORS_ORIGINS: 'http://localhost:5180' })],
        }),
        PrismaModule,
        SpeciesModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('GET /species works without a token and returns the Species shape', async () => {
    const response = await http()
      .get('/api/v1/species?search=monst')
      .expect(200);
    expect(response.body).toEqual([
      {
        id: MONSTERA.id,
        scientificName: 'Monstera Deliciosa',
        commonName: 'Swiss Cheese Plant',
        recommendedLight: 'BRIGHT_INDIRECT',
        photoUrl: null,
        photoAttribution: null,
      },
    ]);
  });

  it('passes the trimmed search and the limit as a number', async () => {
    prisma.species.findMany.mockClear();
    await http().get('/api/v1/species?search=%20fern%20&limit=3').expect(200);
    expect(prisma.species.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 }),
    );
    const call = prisma.species.findMany.mock.calls[0] as unknown as [
      { where: { OR: Array<{ commonName?: { contains: string } }> } },
    ];
    expect(call[0].where.OR[1]?.commonName?.contains).toBe('fern');
  });

  it.each([
    ['limit 0', 'limit=0'],
    ['limit above 100', 'limit=101'],
    ['limit not a number', 'limit=ten'],
    ['search longer than 100', `search=${'x'.repeat(101)}`],
    ['unknown parameter', 'sort=name'],
  ])('400: %s', async (_label, query) => {
    await http().get(`/api/v1/species?${query}`).expect(400);
  });

  it('GET /species/:id returns one species', async () => {
    const response = await http()
      .get(`/api/v1/species/${MONSTERA.id}`)
      .expect(200);
    expect((response.body as { commonName: string }).commonName).toBe(
      'Swiss Cheese Plant',
    );
  });

  it.each(['00000000-0000-4000-8000-000000000000', 'monstera'])(
    '404: unknown or malformed id %s',
    async (id) => {
      await http().get(`/api/v1/species/${id}`).expect(404);
    },
  );
});
