import { NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { PlantsService } from '../plants/plants.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { CareHistoryService } from './care-history.service.js';
import { CreateCareLogDto } from './dto/create-care-log.dto.js';

const OWNER = '11111111-1111-4111-8111-111111111111';
const PLANT_ID = '22222222-2222-4222-8222-222222222222';
const NEWEST_FIRST = [{ actionDate: 'desc' }, { createdAt: 'desc' }];

function createPrismaMock() {
  return {
    careHistory: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  };
}

describe('CareHistoryService (Prisma mocked)', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let plants: { findOwnedOrThrow: ReturnType<typeof vi.fn> };
  let service: CareHistoryService;

  beforeEach(() => {
    prisma = createPrismaMock();
    plants = { findOwnedOrThrow: vi.fn().mockResolvedValue({ id: PLANT_ID }) };
    service = new CareHistoryService(
      prisma as unknown as PrismaService,
      plants as unknown as PlantsService,
    );
  });

  describe('findForPlant', () => {
    it('checks ownership, then lists the plant entries newest first', async () => {
      prisma.careHistory.findMany.mockResolvedValue([]);
      await expect(service.findForPlant(OWNER, PLANT_ID)).resolves.toEqual([]);
      expect(plants.findOwnedOrThrow).toHaveBeenCalledWith(OWNER, PLANT_ID);
      expect(prisma.careHistory.findMany).toHaveBeenCalledWith({
        where: { plantId: PLANT_ID },
        orderBy: NEWEST_FIRST,
      });
    });

    it("throws 404 for another user's plant and never reads the history", async () => {
      plants.findOwnedOrThrow.mockRejectedValue(
        new NotFoundException('Plant not found'),
      );
      await expect(
        service.findForPlant(OWNER, PLANT_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.careHistory.findMany).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('stores the action, trimmed notes and a server-side UTC date', async () => {
      prisma.careHistory.create.mockImplementation(
        ({ data }: { data: object }) =>
          Promise.resolve({ id: 'log-1', ...data }),
      );
      const before = Date.now();
      await service.create(OWNER, PLANT_ID, {
        actionType: 'WATERED',
        notes: '  test note  ',
      });

      expect(plants.findOwnedOrThrow).toHaveBeenCalledWith(OWNER, PLANT_ID);
      const { data } = prisma.careHistory.create.mock.calls[0][0] as {
        data: {
          plantId: string;
          actionType: string;
          actionDate: Date;
          notes: string | null;
        };
      };
      expect(data.plantId).toBe(PLANT_ID);
      expect(data.actionType).toBe('WATERED');
      expect(data.notes).toBe('test note');
      expect(data.actionDate).toBeInstanceOf(Date);
      expect(data.actionDate.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('stores null when notes are missing or blank', async () => {
      prisma.careHistory.create.mockResolvedValue({});
      await service.create(OWNER, PLANT_ID, { actionType: 'FED' });
      await service.create(OWNER, PLANT_ID, {
        actionType: 'FED',
        notes: '   ',
      });
      for (const [arg] of prisma.careHistory.create.mock.calls as [
        { data: { notes: string | null } },
      ][]) {
        expect(arg.data.notes).toBeNull();
      }
    });

    it("throws 404 for another user's plant and never writes", async () => {
      plants.findOwnedOrThrow.mockRejectedValue(
        new NotFoundException('Plant not found'),
      );
      await expect(
        service.create(OWNER, PLANT_ID, { actionType: 'WATERED' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.careHistory.create).not.toHaveBeenCalled();
    });
  });

  describe('findAllForOwner', () => {
    it("returns only entries of the owner's plants, newest first", async () => {
      prisma.careHistory.findMany.mockResolvedValue([]);
      await service.findAllForOwner(OWNER);
      expect(prisma.careHistory.findMany).toHaveBeenCalledWith({
        where: { plant: { ownerId: OWNER } },
        orderBy: NEWEST_FIRST,
      });
    });
  });
});

describe('CreateCareLogDto validation', () => {
  async function errorsFor(body: object) {
    return validate(plainToInstance(CreateCareLogDto, body));
  }

  it.each(['WATERED', 'FED', 'REPOTTED', 'SOIL_WET'])(
    'accepts %s',
    async (actionType) => {
      expect(await errorsFor({ actionType })).toHaveLength(0);
    },
  );

  it.each(['DONE', 'NOTE', 'SOIL_STILL_WET', 'watered', '', 42])(
    'rejects actionType %s',
    async (actionType) => {
      const errors = await errorsFor({ actionType });
      expect(errors.map((e) => e.property)).toEqual(['actionType']);
    },
  );

  it('rejects a missing actionType', async () => {
    expect((await errorsFor({})).map((e) => e.property)).toEqual([
      'actionType',
    ]);
  });

  it('trims notes and allows up to 500 characters after trimming', async () => {
    const dto = plainToInstance(CreateCareLogDto, {
      actionType: 'WATERED',
      notes: `  ${'x'.repeat(500)}  `,
    });
    expect(dto.notes).toHaveLength(500);
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects notes longer than 500 characters or not a string', async () => {
    for (const notes of ['x'.repeat(501), 123]) {
      const errors = await errorsFor({ actionType: 'WATERED', notes });
      expect(errors.map((e) => e.property)).toEqual(['notes']);
    }
  });
});
