import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { hasTestDatabase, resetDatabase } from './support/database.js';

interface AuthBody {
  accessToken: string;
  user: { id: string; email: string };
}

interface CareTaskBody {
  plantId: string;
  taskType: 'WATER' | 'FEED';
  nextDueDate: string;
  status: string;
  intervalDays: number;
  waterAmountMl?: { min: number; max: number };
}

/**
 * Care tasks from the schedule engine and the too-early guard, against a real
 * PostgreSQL database with the seeded species catalog.
 * Skipped when E2E_DATABASE_URL is not set (see vitest.config.e2e.ts).
 */
describe.skipIf(!hasTestDatabase)(
  'Care tasks API with PostgreSQL (e2e)',
  () => {
    let app: INestApplication<App>;
    let prisma: PrismaService;
    let owner: { token: string };
    let other: { token: string };
    let cactusId: string;
    let fernId: string;

    const http = () => request(app.getHttpServer());
    const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

    async function signUp(email: string) {
      const credentials = { email, password: 'password123' };
      await http().post('/api/v1/auth/register').send(credentials).expect(201);
      const login = await http()
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(200);
      return { token: (login.body as AuthBody).accessToken };
    }

    async function createPlant(token: string, name: string, speciesId: string) {
      const response = await http()
        .post('/api/v1/plants')
        .set(bearer(token))
        .send({
          name,
          species: name,
          speciesId,
          lightCondition: 'MEDIUM',
          potSize: 'MEDIUM',
          radiatorDistance: 'NONE',
        })
        .expect(201);
      return (response.body as { id: string }).id;
    }

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
      app = moduleRef.createNestApplication();
      configureApp(app);
      await app.init();
      prisma = app.get(PrismaService);
      await resetDatabase(prisma);

      const low = await prisma.species.findFirstOrThrow({
        where: { waterNeed: 'LOW' },
      });
      const high = await prisma.species.findFirstOrThrow({
        where: { waterNeed: 'HIGH' },
      });
      owner = await signUp('tasks-owner@example.test');
      other = await signUp('tasks-other@example.test');
      cactusId = await createPlant(owner.token, 'Cactus', low.id);
      fernId = await createPlant(owner.token, 'Fern', high.id);
    });

    afterAll(async () => {
      await app?.close();
    });

    it('401 without a token', async () => {
      await http().get('/api/v1/care-tasks').expect(401);
    });

    it('waters the cactus later than the fern, and only shows own plants', async () => {
      const response = await http()
        .get('/api/v1/care-tasks')
        .set(bearer(owner.token))
        .expect(200);
      const tasks = response.body as CareTaskBody[];
      expect(tasks).toHaveLength(4);
      const water = (id: string) =>
        tasks.find((t) => t.plantId === id && t.taskType === 'WATER');
      expect(water(cactusId)!.intervalDays).toBeGreaterThan(
        water(fernId)!.intervalDays,
      );
      expect(water(cactusId)!.waterAmountMl).toEqual({ min: 150, max: 250 });

      const others = await http()
        .get('/api/v1/care-tasks')
        .set(bearer(other.token))
        .expect(200);
      expect(others.body).toEqual([]);
    });

    it('rejects a second watering in a row unless confirmed', async () => {
      const url = `/api/v1/plants/${fernId}/care-history`;
      await http()
        .post(url)
        .set(bearer(owner.token))
        .send({ actionType: 'WATERED' })
        .expect(201);
      const second = await http()
        .post(url)
        .set(bearer(owner.token))
        .send({ actionType: 'WATERED' })
        .expect(409);
      expect((second.body as { code: string }).code).toBe('TOO_EARLY');
      await http()
        .post(url)
        .set(bearer(owner.token))
        .send({ actionType: 'WATERED', confirm: true })
        .expect(201);
    });

    it('allows one soil check per day', async () => {
      const url = `/api/v1/plants/${cactusId}/care-history`;
      await http()
        .post(url)
        .set(bearer(owner.token))
        .send({ actionType: 'SOIL_WET' })
        .expect(201);
      const second = await http()
        .post(url)
        .set(bearer(owner.token))
        .send({ actionType: 'SOIL_WET', confirm: true })
        .expect(409);
      expect((second.body as { code: string }).code).toBe(
        'ALREADY_LOGGED_TODAY',
      );
    });

    it("returns 404, not 409, for another user's plant", async () => {
      await http()
        .post(`/api/v1/plants/${fernId}/care-history`)
        .set(bearer(other.token))
        .send({ actionType: 'WATERED' })
        .expect(404);
    });
  },
);
