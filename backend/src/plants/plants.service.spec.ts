import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { CreatePlantDto } from './dto/create-plant.dto.js';
import { PlantsService } from './plants.service.js';

const OWNER = '11111111-1111-4111-8111-111111111111';
const PLANT_ID = '22222222-2222-4222-8222-222222222222';

function createPrismaMock() {
  return {
    plant: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  };
}

describe('PlantsService (Prisma mocked)', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: PlantsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new PlantsService(prisma as unknown as PrismaService);
  });

  it('findAllForOwner filters by owner and sorts newest first', async () => {
    prisma.plant.findMany.mockResolvedValue([]);
    await expect(service.findAllForOwner(OWNER)).resolves.toEqual([]);
    expect(prisma.plant.findMany).toHaveBeenCalledWith({
      where: { ownerId: OWNER },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('create stores the plant under the given owner', async () => {
    const dto: CreatePlantDto = {
      name: 'Monstera',
      species: 'Monstera deliciosa',
      lightCondition: 'BRIGHT_INDIRECT',
      potSize: 'MEDIUM',
      radiatorDistance: 'FAR',
    };
    prisma.plant.create.mockResolvedValue({ id: PLANT_ID });
    await service.create(OWNER, dto);
    expect(prisma.plant.create).toHaveBeenCalledWith({
      data: { ownerId: OWNER, ...dto },
    });
  });

  it('create leaves radiatorDistance undefined so the schema default applies', async () => {
    prisma.plant.create.mockResolvedValue({ id: PLANT_ID });
    await service.create(OWNER, {
      name: 'Snake plant',
      species: 'Dracaena trifasciata',
      lightCondition: 'LOW',
      potSize: 'SMALL',
    });
    const call = prisma.plant.create.mock.calls[0]?.[0] as {
      data: { radiatorDistance?: string };
    };
    expect(call.data.radiatorDistance).toBeUndefined();
  });

  it('create throws 401 when the owner no longer exists (foreign key error)', async () => {
    prisma.plant.create.mockRejectedValue(
      Object.assign(new Error('FK'), { code: 'P2003' }),
    );
    await expect(
      service.create(OWNER, {
        name: 'Fern',
        species: 'Nephrolepis',
        lightCondition: 'LOW',
        potSize: 'SMALL',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('create rethrows other database errors', async () => {
    const failure = new Error('connection lost');
    prisma.plant.create.mockRejectedValue(failure);
    await expect(
      service.create(OWNER, {
        name: 'Fern',
        species: 'Nephrolepis',
        lightCondition: 'LOW',
        potSize: 'SMALL',
      }),
    ).rejects.toBe(failure);
  });

  describe('findOwnedOrThrow', () => {
    it('returns the plant when it belongs to the owner', async () => {
      const plant = { id: PLANT_ID, ownerId: OWNER };
      prisma.plant.findFirst.mockResolvedValue(plant);
      await expect(service.findOwnedOrThrow(OWNER, PLANT_ID)).resolves.toBe(
        plant,
      );
      expect(prisma.plant.findFirst).toHaveBeenCalledWith({
        where: { id: PLANT_ID, ownerId: OWNER },
      });
    });

    it('throws 404 when the plant is missing or owned by someone else', async () => {
      prisma.plant.findFirst.mockResolvedValue(null);
      await expect(service.findOwnedOrThrow(OWNER, PLANT_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws 404 for a malformed id without querying the database', async () => {
      await expect(service.findOwnedOrThrow(OWNER, 'plant-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.plant.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes only within the owner', async () => {
      prisma.plant.deleteMany.mockResolvedValue({ count: 1 });
      await expect(service.remove(OWNER, PLANT_ID)).resolves.toBeUndefined();
      expect(prisma.plant.deleteMany).toHaveBeenCalledWith({
        where: { id: PLANT_ID, ownerId: OWNER },
      });
    });

    it('throws 404 when nothing was deleted', async () => {
      prisma.plant.deleteMany.mockResolvedValue({ count: 0 });
      await expect(service.remove(OWNER, PLANT_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws 404 for a malformed id without querying the database', async () => {
      await expect(service.remove(OWNER, 'nope')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.plant.deleteMany).not.toHaveBeenCalled();
    });
  });
});
