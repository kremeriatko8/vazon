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
