import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { configureApp } from '../app.setup.js';
import type { ErrorResponseBody } from '../common/filters/http-exception.filter.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PlantsModule } from './plants.module.js';

interface StoredPlant {
  id: string;
  ownerId: string;
  name: string;
  species: string;
  lightCondition: string;
  potSize: string;
  radiatorDistance: string;
  speciesId: string | null;
  photoKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type PlantWhere = { id?: string; ownerId?: string };

const matches = (plant: StoredPlant, where: PlantWhere) =>
  (where.id === undefined || plant.id === where.id) &&
  (where.ownerId === undefined || plant.ownerId === where.ownerId);

/** The only species id the in-memory catalog knows. */
const KNOWN_SPECIES_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

/** In-memory stand-in for the plants table. No database is used. */
function createInMemoryPrisma() {
  let plants: StoredPlant[] = [];
  let clock = Date.parse('2026-11-18T09:00:00.000Z');
  return {
    get plants() {
      return plants;
    },
    plant: {
      findMany: vi.fn(({ where }: { where: PlantWhere }) =>
        Promise.resolve(
          plants
            .filter((p) => matches(p, where))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
        ),
      ),
      // Copies, like the real Prisma Client: callers must not see later updates.
      findFirst: vi.fn(({ where }: { where: PlantWhere }) => {
        const plant = plants.find((p) => matches(p, where));
        return Promise.resolve(plant ? { ...plant } : null);
      }),
      create: vi.fn(
        ({
          data,
        }: {
          data: Omit<StoredPlant, 'id' | 'createdAt' | 'updatedAt'>;
        }) => {
          clock += 60_000;
          const plant: StoredPlant = {
            ...data,
            radiatorDistance: data.radiatorDistance ?? 'NONE',
            speciesId: data.speciesId ?? null,
            photoKey: null,
            id: randomUUID(),
            createdAt: new Date(clock),
            updatedAt: new Date(clock),
          };
          plants.push(plant);
          return Promise.resolve(plant);
        },
      ),
      update: vi.fn(
        ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<StoredPlant>;
        }) => {
          const plant = plants.find((p) => p.id === where.id);
          if (!plant) return Promise.reject(new Error('not found'));
          Object.assign(plant, data);
          return Promise.resolve({ ...plant });
        },
      ),
      deleteMany: vi.fn(({ where }: { where: PlantWhere }) => {
        const before = plants.length;
        plants = plants.filter((p) => !matches(p, where));
        return Promise.resolve({ count: before - plants.length });
      }),
    },
    species: {
      findUnique: vi.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve(
          where.id === KNOWN_SPECIES_ID ? { id: KNOWN_SPECIES_ID } : null,
        ),
      ),
    },
  };
}

describe('PlantsController (HTTP, Prisma mocked)', () => {
  const uploadsDir = mkdtempSync(join(tmpdir(), 'vazon-uploads-'));
  let app: INestApplication<App>;
  let prisma: ReturnType<typeof createInMemoryPrisma>;
  let ownerToken: string;
  let otherToken: string;
  const ownerId = randomUUID();
  const otherId = randomUUID();

  const monstera = {
    name: 'Living room monstera',
    species: 'Monstera deliciosa',
    lightCondition: 'BRIGHT_INDIRECT',
    potSize: 'MEDIUM',
    radiatorDistance: 'FAR',
  };

  beforeAll(async () => {
    prisma = createInMemoryPrisma();
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              JWT_SECRET: 'plants-test-secret',
              CORS_ORIGINS: 'http://localhost:5180',
              UPLOADS_DIR: uploadsDir,
            }),
          ],
        }),
        PrismaModule,
        PlantsModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    const jwt = app.get(JwtService);
    ownerToken = await jwt.signAsync({ sub: ownerId });
    otherToken = await jwt.signAsync({ sub: otherId });
  });

  afterAll(async () => {
    await app.close();
    rmSync(uploadsDir, { recursive: true, force: true });
  });

  const http = () => request(app.getHttpServer());
  const asOwner = (token = ownerToken) => ({
    Authorization: `Bearer ${token}`,
  });

  const createPlant = async (body: object = monstera, token = ownerToken) =>
    (
      await http()
        .post('/api/v1/plants')
        .set(asOwner(token))
        .send(body)
        .expect(201)
    ).body as Record<string, unknown>;

  describe('authentication', () => {
    it.each([
      ['GET', '/api/v1/plants'],
      ['POST', '/api/v1/plants'],
      ['GET', `/api/v1/plants/${randomUUID()}`],
      ['DELETE', `/api/v1/plants/${randomUUID()}`],
    ])('401: %s %s without a token', async (method, path) => {
      const req =
        method === 'GET'
          ? http().get(path)
          : method === 'POST'
            ? http().post(path)
            : http().delete(path);
      await req.expect(401);
    });

    it('401: with a token signed by another secret', async () => {
      const forged = await new JwtService({ secret: 'wrong' }).signAsync({
        sub: ownerId,
      });
      await http().get('/api/v1/plants').set(asOwner(forged)).expect(401);
    });
  });

  describe('POST /api/v1/plants', () => {
    it('201: returns the Plant object from the contract', async () => {
      const body = await createPlant();
      const { id, createdAt, ...rest } = body;
      expect(rest).toEqual({
        ownerId,
        ...monstera,
        speciesId: null,
        photoUrl: null,
      });
      expect(typeof id).toBe('string');
      expect(createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
      expect(body).not.toHaveProperty('updatedAt');
    });

    it('201: radiatorDistance defaults to NONE', async () => {
      const withoutRadiator: Partial<typeof monstera> = { ...monstera };
      delete withoutRadiator.radiatorDistance;
      const body = await createPlant(withoutRadiator);
      expect(body.radiatorDistance).toBe('NONE');
    });

    it('201: trims the name and species', async () => {
      const body = await createPlant({
        ...monstera,
        name: '  Fern  ',
        species: ' Nephrolepis ',
      });
      expect(body).toMatchObject({ name: 'Fern', species: 'Nephrolepis' });
    });

    it('201: links the plant to a catalog species', async () => {
      const body = await createPlant({
        ...monstera,
        speciesId: KNOWN_SPECIES_ID,
      });
      expect(body.speciesId).toBe(KNOWN_SPECIES_ID);
    });

    it.each([
      ['unknown speciesId', randomUUID()],
      ['malformed speciesId', 'monstera'],
    ])('400: %s', async (_label, speciesId) => {
      await http()
        .post('/api/v1/plants')
        .set(asOwner())
        .send({ ...monstera, speciesId })
        .expect(400);
    });

    it('400: rejects ownerId in the body (the owner comes from the token)', async () => {
      await http()
        .post('/api/v1/plants')
        .set(asOwner())
        .send({ ...monstera, ownerId: otherId })
        .expect(400);
    });

    it.each([
      ['missing name', { ...monstera, name: undefined }],
      ['blank name', { ...monstera, name: '   ' }],
      ['name longer than 100', { ...monstera, name: 'x'.repeat(101) }],
      ['species longer than 150', { ...monstera, species: 'x'.repeat(151) }],
      ['invalid lightCondition', { ...monstera, lightCondition: 'SUNNY' }],
      ['lowercase enum value', { ...monstera, potSize: 'medium' }],
      ['missing potSize', { ...monstera, potSize: undefined }],
      ['invalid radiatorDistance', { ...monstera, radiatorDistance: 'CLOSE' }],
      ['unknown field', { ...monstera, wateringIntervalDays: 7 }],
    ])('400: %s', async (_label, body) => {
      const response = await http()
        .post('/api/v1/plants')
        .set(asOwner())
        .send(body)
        .expect(400);
      expect((response.body as ErrorResponseBody).path).toBe('/api/v1/plants');
    });
  });

  describe('GET /api/v1/plants', () => {
    it("200: returns only the current user's plants, newest first", async () => {
      const first = await createPlant({ ...monstera, name: 'First' });
      const second = await createPlant({ ...monstera, name: 'Second' });
      await createPlant({ ...monstera, name: 'Not mine' }, otherToken);

      const response = await http()
        .get('/api/v1/plants')
        .set(asOwner())
        .expect(200);
      const list = response.body as Array<{ id: string; ownerId: string }>;

      expect(list.every((p) => p.ownerId === ownerId)).toBe(true);
      const ids = list.map((p) => p.id);
      expect(ids.indexOf(second.id as string)).toBeLessThan(
        ids.indexOf(first.id as string),
      );
    });

    it('200: an empty array for a user with no plants', async () => {
      const token = await app.get(JwtService).signAsync({ sub: randomUUID() });
      await http().get('/api/v1/plants').set(asOwner(token)).expect(200, []);
    });
  });

  describe('GET /api/v1/plants/:plantId', () => {
    it('200: returns the plant', async () => {
      const created = await createPlant();
      await http()
        .get(`/api/v1/plants/${created.id as string}`)
        .set(asOwner())
        .expect(200, created);
    });

    it("404: another user's plant", async () => {
      const created = await createPlant();
      const response = await http()
        .get(`/api/v1/plants/${created.id as string}`)
        .set(asOwner(otherToken))
        .expect(404);
      expect((response.body as ErrorResponseBody).message).toBe(
        'Plant not found',
      );
    });

    it.each([randomUUID(), 'plant-1'])(
      '404: unknown or malformed id %s',
      async (id) => {
        await http().get(`/api/v1/plants/${id}`).set(asOwner()).expect(404);
      },
    );
  });

  describe('DELETE /api/v1/plants/:plantId', () => {
    it('204: deletes the plant, then GET returns 404', async () => {
      const created = await createPlant();
      const path = `/api/v1/plants/${created.id as string}`;
      const response = await http().delete(path).set(asOwner()).expect(204);
      expect(response.text).toBe('');
      await http().get(path).set(asOwner()).expect(404);
    });

    it("404: cannot delete another user's plant, and it stays", async () => {
      const created = await createPlant();
      const path = `/api/v1/plants/${created.id as string}`;
      await http().delete(path).set(asOwner(otherToken)).expect(404);
      await http().get(path).set(asOwner()).expect(200);
    });

    it('404: unknown id', async () => {
      await http()
        .delete(`/api/v1/plants/${randomUUID()}`)
        .set(asOwner())
        .expect(404);
    });
  });

  describe('plant photo', () => {
    const PNG = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.from('fake image body'),
    ]);
    const upload = (plantId: string, token = ownerToken) =>
      http().post(`/api/v1/plants/${plantId}/photo`).set(asOwner(token));

    it('200: uploads a photo that is then served as an image', async () => {
      const plant = await createPlant();
      const response = await upload(plant.id as string)
        .attach('photo', PNG, 'leaf.png')
        .expect(200);
      const photoUrl = (response.body as { photoUrl: string }).photoUrl;
      expect(photoUrl).toMatch(/^\/api\/v1\/uploads\/[0-9a-f]{32}\.png$/);

      const image = await http().get(photoUrl).expect(200);
      expect(image.headers['content-type']).toBe('image/png');
      expect(image.headers['x-content-type-options']).toBe('nosniff');
      expect(Buffer.compare(image.body as Buffer, PNG)).toBe(0);
    });

    it('a new upload replaces the old file', async () => {
      const plant = await createPlant();
      const first = await upload(plant.id as string)
        .attach('photo', PNG, 'a.png')
        .expect(200);
      const second = await upload(plant.id as string)
        .attach('photo', PNG, 'b.png')
        .expect(200);
      const oldUrl = (first.body as { photoUrl: string }).photoUrl;
      expect((second.body as { photoUrl: string }).photoUrl).not.toBe(oldUrl);
      await http().get(oldUrl).expect(404);
    });

    it('DELETE removes the photo and the file', async () => {
      const plant = await createPlant();
      const uploaded = await upload(plant.id as string)
        .attach('photo', PNG, 'a.png')
        .expect(200);
      const url = (uploaded.body as { photoUrl: string }).photoUrl;

      const response = await http()
        .delete(`/api/v1/plants/${plant.id as string}/photo`)
        .set(asOwner())
        .expect(200);
      expect((response.body as { photoUrl: null }).photoUrl).toBeNull();
      await http().get(url).expect(404);
    });

    it('deleting the plant deletes its photo file', async () => {
      const plant = await createPlant();
      const uploaded = await upload(plant.id as string)
        .attach('photo', PNG, 'a.png')
        .expect(200);
      await http()
        .delete(`/api/v1/plants/${plant.id as string}`)
        .set(asOwner())
        .expect(204);
      await http()
        .get((uploaded.body as { photoUrl: string }).photoUrl)
        .expect(404);
    });

    it('400: an SVG named .png is rejected by its content', async () => {
      const plant = await createPlant();
      await upload(plant.id as string)
        .attach('photo', Buffer.from('<svg onload="alert(1)"/>'), {
          filename: 'evil.png',
          contentType: 'image/png',
        })
        .expect(400);
    });

    it('400: no file', async () => {
      const plant = await createPlant();
      await upload(plant.id as string)
        .field('note', 'x')
        .expect(400);
      await upload(plant.id as string).expect(400);
    });

    it('400: file sent in another field', async () => {
      const plant = await createPlant();
      await upload(plant.id as string)
        .attach('image', PNG, 'a.png')
        .expect(400);
    });

    it('413: larger than 5 MB', async () => {
      const plant = await createPlant();
      const big = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]);
      await upload(plant.id as string)
        .attach('photo', big, 'big.png')
        .expect(413);
    });

    it("404: cannot upload to another user's plant", async () => {
      const plant = await createPlant();
      await upload(plant.id as string, otherToken)
        .attach('photo', PNG, 'a.png')
        .expect(404);
    });

    it('401: without a token', async () => {
      await http()
        .post(`/api/v1/plants/${randomUUID()}/photo`)
        .attach('photo', PNG, 'a.png')
        .expect(401);
    });

    it('404 JSON for an unknown photo path', async () => {
      const response = await http()
        .get('/api/v1/uploads/00000000000000000000000000000000.png')
        .expect(404);
      expect((response.body as ErrorResponseBody).statusCode).toBe(404);
    });
  });
});
