import { ConflictException, NotFoundException } from '@nestjs/common';
import type { PlantsService } from '../plants/plants.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { CareTasksService } from './care-tasks.service.js';

const OWNER = '11111111-1111-4111-8111-111111111111';
const PLANT_ID = '22222222-2222-4222-8222-222222222222';
const NOW = new Date('2026-11-19T10:00:00Z');

const basePlant = {
  id: PLANT_ID,
  ownerId: OWNER,
  name: 'Cactus',
  species: 'Opuntia',
  speciesId: null as string | null,
  lightCondition: 'MEDIUM',
  potSize: 'MEDIUM',
  radiatorDistance: 'NONE',
  createdAt: new Date('2026-11-01T10:00:00Z'),
};

function setup() {
  const prisma = {
    plant: { findMany: vi.fn() },
    careHistory: { findMany: vi.fn().mockResolvedValue([]) },
    species: { findUnique: vi.fn().mockResolvedValue(null) },
  };
  const plants = { findOwnedOrThrow: vi.fn().mockResolvedValue(basePlant) };
  const service = new CareTasksService(
    prisma as unknown as PrismaService,
    plants as unknown as PlantsService,
  );
  return { prisma, plants, service };
}

describe('CareTasksService.findForOwner', () => {
  it('gives a LOW water-need plant a later watering than a HIGH one', async () => {
    const { prisma, service } = setup();
    prisma.plant.findMany.mockResolvedValue([
      {
        ...basePlant,
        id: 'a',
        name: 'Cactus',
        speciesInfo: { waterNeed: 'LOW' },
      },
      {
        ...basePlant,
        id: 'b',
        name: 'Fern',
        speciesInfo: { waterNeed: 'HIGH' },
      },
    ]);
    const tasks = await service.findForOwner(OWNER, NOW);
    const water = (id: string) =>
      tasks.find((t) => t.plantId === id && t.taskType === 'WATER')!;
    expect(water('a').nextDueDate > water('b').nextDueDate).toBe(true);
    expect(water('a').waterAmountMl).toEqual({ min: 150, max: 250 });
    expect(
      tasks.find((t) => t.taskType === 'FEED')?.waterAmountMl,
    ).toBeUndefined();
  });

  it('marks a task overdue when its due day has passed', async () => {
    const { prisma, service } = setup();
    prisma.plant.findMany.mockResolvedValue([
      { ...basePlant, speciesInfo: null },
    ]);
    prisma.careHistory.findMany.mockResolvedValue([
      {
        plantId: PLANT_ID,
        actionType: 'WATERED',
        actionDate: new Date('2026-10-01T10:00:00Z'),
      },
    ]);
    const tasks = await service.findForOwner(OWNER, NOW);
    const water = tasks.find((t) => t.taskType === 'WATER')!;
    expect(water.status).toBe('OVERDUE');
    expect(water.lastDoneAt).toBe('2026-10-01T10:00:00.000Z');
  });
});

describe('CareTasksService.assertCanLog', () => {
  it('rejects a second watering soon after the first', async () => {
    const { prisma, service } = setup();
    prisma.careHistory.findMany.mockResolvedValue([
      { actionType: 'WATERED', actionDate: new Date('2026-11-18T10:00:00Z') },
    ]);
    const error = await service
      .assertCanLog(OWNER, PLANT_ID, 'WATERED', false, NOW)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ConflictException);
    const body = (error as ConflictException).getResponse() as Record<
      string,
      unknown
    >;
    expect(body.code).toBe('TOO_EARLY');
    expect(body.message).toMatch(
      /^Watered yesterday\. Next watering is due on \d{4}-\d{2}-\d{2}\.$/,
    );
  });

  it('allows it with confirm', async () => {
    const { prisma, service } = setup();
    prisma.careHistory.findMany.mockResolvedValue([
      { actionType: 'WATERED', actionDate: new Date('2026-11-19T09:00:00Z') },
    ]);
    await expect(
      service.assertCanLog(OWNER, PLANT_ID, 'WATERED', true, NOW),
    ).resolves.toBeUndefined();
  });

  it('allows the first watering and a late one', async () => {
    const { prisma, service } = setup();
    await expect(
      service.assertCanLog(OWNER, PLANT_ID, 'WATERED', false, NOW),
    ).resolves.toBeUndefined();
    prisma.careHistory.findMany.mockResolvedValue([
      { actionType: 'WATERED', actionDate: new Date('2026-11-01T10:00:00Z') },
    ]);
    await expect(
      service.assertCanLog(OWNER, PLANT_ID, 'WATERED', false, NOW),
    ).resolves.toBeUndefined();
  });

  it('allows only one soil check per day, even with confirm', async () => {
    const { prisma, service } = setup();
    prisma.careHistory.findMany.mockResolvedValue([
      { actionType: 'SOIL_WET', actionDate: new Date('2026-11-19T07:00:00Z') },
    ]);
    const error = await service
      .assertCanLog(OWNER, PLANT_ID, 'SOIL_WET', true, NOW)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ConflictException);
    expect(
      ((error as ConflictException).getResponse() as Record<string, unknown>)
        .code,
    ).toBe('ALREADY_LOGGED_TODAY');
  });

  it('never guards repotting', async () => {
    const { prisma, service } = setup();
    await service.assertCanLog(OWNER, PLANT_ID, 'REPOTTED', false, NOW);
    expect(prisma.careHistory.findMany).not.toHaveBeenCalled();
  });

  it("returns 404 for another user's plant before reading history", async () => {
    const { prisma, plants, service } = setup();
    plants.findOwnedOrThrow.mockRejectedValue(new NotFoundException());
    await expect(
      service.assertCanLog(OWNER, PLANT_ID, 'WATERED', false, NOW),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.careHistory.findMany).not.toHaveBeenCalled();
  });
});

describe('water need without a catalog species', () => {
  it('guesses from the typed name: a cactus waters later than a rose', async () => {
    const { prisma, service } = setup();
    prisma.plant.findMany.mockResolvedValue([
      {
        ...basePlant,
        id: 'c',
        name: 'Кактус',
        species: 'кактус',
        speciesInfo: null,
      },
      {
        ...basePlant,
        id: 'r',
        name: 'Троянда',
        species: 'троянда',
        speciesInfo: null,
      },
      {
        ...basePlant,
        id: 'm',
        name: 'Монстера',
        species: 'монстера',
        speciesInfo: null,
      },
    ]);
    const tasks = await service.findForOwner(OWNER, NOW);
    const water = (id: string) =>
      tasks.find((t) => t.plantId === id && t.taskType === 'WATER')!;
    expect(water('c').waterNeed).toBe('LOW');
    expect(water('c').waterNeedSource).toBe('NAME');
    expect(water('r').waterNeed).toBe('HIGH');
    expect(water('m').waterNeedSource).toBe('DEFAULT');
    expect(water('c').intervalDays).toBeGreaterThan(water('m').intervalDays);
    expect(water('m').intervalDays).toBeGreaterThan(water('r').intervalDays);
  });

  it('prefers the catalog species over the typed name', async () => {
    const { prisma, service } = setup();
    prisma.plant.findMany.mockResolvedValue([
      { ...basePlant, species: 'кактус', speciesInfo: { waterNeed: 'HIGH' } },
    ]);
    const [task] = await service.findForOwner(OWNER, NOW);
    expect(task.waterNeed).toBe('HIGH');
    expect(task.waterNeedSource).toBe('CATALOG');
  });
});

describe('personal schedule', () => {
  it('lengthens watering for a plant whose soil stays wet', async () => {
    const { prisma, service } = setup();
    prisma.plant.findMany.mockResolvedValue([
      {
        ...basePlant,
        id: 'p',
        name: 'Монстера',
        species: 'монстера',
        speciesInfo: null,
      },
    ]);
    const at = (iso: string) => new Date(`${iso}T09:00:00Z`);
    prisma.careHistory.findMany.mockResolvedValue(
      [
        ['WATERED', '2026-11-15'],
        ['SOIL_WET', '2026-11-12'],
        ['SOIL_WET', '2026-11-13'],
        ['WATERED', '2026-11-06'],
        ['SOIL_WET', '2026-11-03'],
        ['SOIL_WET', '2026-11-04'],
        ['WATERED', '2026-10-28'],
      ].map(([actionType, date]) => ({
        plantId: 'p',
        actionType,
        actionDate: at(date),
      })),
    );
    const tasks = await service.findForOwner(OWNER, NOW);
    const water = tasks.find((t) => t.taskType === 'WATER')!;
    expect(water.learnedCycles).toBe(2);
    expect(water.personalFactor).toBeGreaterThan(1);
    expect(water.intervalDays).toBeGreaterThan(7);
    const feed = tasks.find((t) => t.taskType === 'FEED')!;
    expect(feed.personalFactor).toBe(1);
  });
});

describe('genus profiles', () => {
  it('gives a Monstera and a rubber plant different watering', async () => {
    const { prisma, service } = setup();
    prisma.plant.findMany.mockResolvedValue([
      {
        ...basePlant,
        id: 'm',
        name: 'Monstera',
        species: 'Monstera deliciosa',
        speciesInfo: { waterNeed: 'MEDIUM', wateringFactor: 1.0 },
      },
      {
        ...basePlant,
        id: 'f',
        name: 'Rubber plant',
        species: 'Ficus elastica',
        speciesInfo: { waterNeed: 'MEDIUM', wateringFactor: 1.3 },
      },
    ]);
    const tasks = await service.findForOwner(OWNER, NOW);
    const water = (id: string) =>
      tasks.find((t) => t.plantId === id && t.taskType === 'WATER')!;
    expect(water('m').intervalDays).toBe(7);
    expect(water('f').intervalDays).toBe(9);
  });
});
