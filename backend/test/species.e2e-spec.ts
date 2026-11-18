import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { hasTestDatabase, resetDatabase } from './support/database.js';

interface SpeciesBody {
  id: string;
  scientificName: string;
  commonName: string;
  recommendedLight: string;
}

/**
 * Checks the species catalog that the data migration inserts, and linking a
 * plant to it. Skipped when E2E_DATABASE_URL is not set.
 */
describe.skipIf(!hasTestDatabase)(
  'Species catalog with PostgreSQL (e2e)',
  () => {
    let app: INestApplication<App>;

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
      app = moduleRef.createNestApplication();
      configureApp(app);
      await app.init();
      // Clears users and plants only; the catalog is reference data and stays.
      await resetDatabase(app.get(PrismaService));
    });

    afterAll(async () => {
      await app?.close();
    });

    const http = () => request(app.getHttpServer());

    it('the migration inserted all 93 species', async () => {
      const response = await http()
        .get('/api/v1/species?limit=100')
        .expect(200);
      expect(response.body as SpeciesBody[]).toHaveLength(93);
    });

    it('search is case-insensitive and matches botanical and common names', async () => {
      const byCommon = await http()
        .get('/api/v1/species?search=zz')
        .expect(200);
      expect(
        (byCommon.body as SpeciesBody[]).map((s) => s.commonName),
      ).toContain('ZZ Plant');

      const byBotanical = await http()
        .get('/api/v1/species?search=MONSTERA')
        .expect(200);
      expect(
        (byBotanical.body as SpeciesBody[]).map((s) => s.scientificName),
      ).toEqual(
        expect.arrayContaining(['Monstera Deliciosa', 'Monstera Adansonii']),
      );
    });

    it('a plant can be created with a speciesId from the catalog', async () => {
      const [species] = (
        await http().get('/api/v1/species?search=Swiss%20Cheese').expect(200)
      ).body as SpeciesBody[];

      const credentials = {
        email: 'species@example.com',
        password: 'password123',
      };
      await http().post('/api/v1/auth/register').send(credentials).expect(201);
      const login = await http()
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(200);
      const token = (login.body as { accessToken: string }).accessToken;

      const plant = await http()
        .post('/api/v1/plants')
        .set({ Authorization: `Bearer ${token}` })
        .send({
          name: 'Living room monstera',
          species: species.scientificName,
          lightCondition: species.recommendedLight,
          potSize: 'MEDIUM',
          speciesId: species.id,
        })
        .expect(201);
      expect((plant.body as { speciesId: string }).speciesId).toBe(species.id);
    });
  },
);
