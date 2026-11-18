import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { hasTestDatabase, resetDatabase } from './support/database.js';

interface PlantBody {
  id: string;
  ownerId: string;
  name: string;
  radiatorDistance: string;
}

/**
 * The full path a user takes, against a real PostgreSQL database:
 * register -> login -> create plants -> list -> get -> delete.
 * Skipped when E2E_DATABASE_URL is not set (see vitest.config.e2e.ts).
 */
describe.skipIf(!hasTestDatabase)('Plants API with PostgreSQL (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const monstera = {
    name: 'Living room monstera',
    species: 'Monstera deliciosa',
    lightCondition: 'BRIGHT_INDIRECT',
    potSize: 'MEDIUM',
    radiatorDistance: 'FAR',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app?.close();
  });

  const http = () => request(app.getHttpServer());
  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  /** Registers a new user and returns their id and access token. */
  async function signUp(email: string) {
    const password = 'password123';
    const registered = await http()
      .post('/api/v1/auth/register')
      .send({ email, password })
      .expect(201);
    const login = await http()
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    return {
      id: (registered.body as { id: string }).id,
      token: (login.body as { accessToken: string }).accessToken,
    };
  }

  async function createPlant(token: string, body: object = monstera) {
    const response = await http()
      .post('/api/v1/plants')
      .set(bearer(token))
      .send(body)
      .expect(201);
    return response.body as PlantBody;
  }

  it('stores a plant for the token owner and applies the radiator default', async () => {
    const owner = await signUp('owner@example.com');
    const withoutRadiator: Partial<typeof monstera> = { ...monstera };
    delete withoutRadiator.radiatorDistance;

    const plant = await createPlant(owner.token, withoutRadiator);

    expect(plant.ownerId).toBe(owner.id);
    expect(plant.radiatorDistance).toBe('NONE');
    const row = await prisma.plant.findUnique({ where: { id: plant.id } });
    expect(row?.ownerId).toBe(owner.id);
  });

  it("lists, reads and deletes only the user's own plants", async () => {
    const alice = await signUp('alice@example.com');
    const bob = await signUp('bob@example.com');
    const older = await createPlant(alice.token, {
      ...monstera,
      name: 'Older',
    });
    const newer = await createPlant(alice.token, {
      ...monstera,
      name: 'Newer',
    });
    const bobs = await createPlant(bob.token, {
      ...monstera,
      name: 'Bob plant',
    });

    const list = await http()
      .get('/api/v1/plants')
      .set(bearer(alice.token))
      .expect(200);
    expect((list.body as PlantBody[]).map((p) => p.id)).toEqual([
      newer.id,
      older.id,
    ]);

    await http()
      .get(`/api/v1/plants/${older.id}`)
      .set(bearer(alice.token))
      .expect(200);
    await http()
      .get(`/api/v1/plants/${bobs.id}`)
      .set(bearer(alice.token))
      .expect(404);
    await http()
      .delete(`/api/v1/plants/${bobs.id}`)
      .set(bearer(alice.token))
      .expect(404);
    expect(await prisma.plant.count({ where: { id: bobs.id } })).toBe(1);
  });

  it('stores a photo on disk, serves it, and deletes it with the plant', async () => {
    const owner = await signUp('photo@example.com');
    const plant = await createPlant(owner.token);
    const jpeg = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      Buffer.from('jpeg body'),
    ]);

    const uploaded = await http()
      .post(`/api/v1/plants/${plant.id}/photo`)
      .set(bearer(owner.token))
      .attach('photo', jpeg, 'leaf.jpg')
      .expect(200);
    const photoUrl = (uploaded.body as { photoUrl: string }).photoUrl;
    const row = await prisma.plant.findUnique({ where: { id: plant.id } });
    expect(photoUrl).toBe(`/api/v1/uploads/${row?.photoKey}`);

    const image = await http().get(photoUrl).expect(200);
    expect(image.headers['content-type']).toBe('image/jpeg');

    await http()
      .delete(`/api/v1/plants/${plant.id}`)
      .set(bearer(owner.token))
      .expect(204);
    await http().get(photoUrl).expect(404);
  });

  it('deleting a plant also deletes its tasks and care history', async () => {
    const owner = await signUp('cascade@example.com');
    const plant = await createPlant(owner.token);
    const task = await prisma.careTask.create({
      data: {
        plantId: plant.id,
        taskType: 'WATER',
        scheduledDate: new Date('2026-11-20T00:00:00.000Z'),
      },
    });
    await prisma.careHistory.create({
      data: { plantId: plant.id, careTaskId: task.id, actionType: 'WATERED' },
    });

    await http()
      .delete(`/api/v1/plants/${plant.id}`)
      .set(bearer(owner.token))
      .expect(204);

    expect(await prisma.careTask.count({ where: { plantId: plant.id } })).toBe(
      0,
    );
    expect(
      await prisma.careHistory.count({ where: { plantId: plant.id } }),
    ).toBe(0);
  });

  it('returns 404, not 500, for ids PostgreSQL cannot parse as UUID', async () => {
    const owner = await signUp('malformed@example.com');
    await http()
      .get('/api/v1/plants/plant-1')
      .set(bearer(owner.token))
      .expect(404);
    await http()
      .get(`/api/v1/plants/${randomUUID()}`)
      .set(bearer(owner.token))
      .expect(404);
  });

  it('a token of a deleted user cannot read plants that no longer exist', async () => {
    const owner = await signUp('gone@example.com');
    const plant = await createPlant(owner.token);
    await prisma.user.delete({ where: { id: owner.id } });

    await http()
      .get(`/api/v1/plants/${plant.id}`)
      .set(bearer(owner.token))
      .expect(404);
  });

  it('401, not 500, when a valid token belongs to a user that no longer exists', async () => {
    // For example, after `docker compose down -v` the browser still holds an old token.
    const owner = await signUp('stale@example.com');
    await prisma.user.delete({ where: { id: owner.id } });

    await http()
      .post('/api/v1/plants')
      .set(bearer(owner.token))
      .send(monstera)
      .expect(401);
  });
});
