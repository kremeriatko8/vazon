import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { SpeciesService } from '../species/species.service.js';
import type { CreatePlantDto } from './dto/create-plant.dto.js';
import type { PhotoStorageService } from './photos/photo-storage.service.js';
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
      update: vi.fn(),
    },
  };
}

describe('PlantsService (Prisma mocked)', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: PlantsService;
  let species: { findById: ReturnType<typeof vi.fn> };
  let photos: {
    save: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    species = { findById: vi.fn() };
    photos = {
      save: vi.fn().mockResolvedValue('new-key'),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    service = new PlantsService(
      prisma as unknown as PrismaService,
      species as unknown as SpeciesService,
      photos as unknown as PhotoStorageService,
    );
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

  it('create stores speciesId when it matches a catalog entry', async () => {
    const SPECIES = '33333333-3333-4333-8333-333333333333';
    species.findById.mockResolvedValue({ id: SPECIES });
    prisma.plant.create.mockResolvedValue({ id: PLANT_ID });
    await service.create(OWNER, {
      name: 'Monstera',
      species: 'Monstera Deliciosa',
      lightCondition: 'BRIGHT_INDIRECT',
      potSize: 'MEDIUM',
      speciesId: SPECIES,
    });
    expect(species.findById).toHaveBeenCalledWith(SPECIES);
    const call = prisma.plant.create.mock.calls[0]?.[0] as {
      data: { speciesId?: string };
    };
    expect(call.data.speciesId).toBe(SPECIES);
  });

  it('create throws 400 for an unknown speciesId and does not insert', async () => {
    species.findById.mockResolvedValue(null);
    await expect(
      service.create(OWNER, {
        name: 'Monstera',
        species: 'Monstera Deliciosa',
        lightCondition: 'BRIGHT_INDIRECT',
        potSize: 'MEDIUM',
        speciesId: '33333333-3333-4333-8333-333333333333',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.plant.create).not.toHaveBeenCalled();
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
    const owned = { id: PLANT_ID, ownerId: OWNER, photoKey: null };

    it('deletes only within the owner', async () => {
      prisma.plant.findFirst.mockResolvedValue(owned);
      prisma.plant.deleteMany.mockResolvedValue({ count: 1 });
      await expect(service.remove(OWNER, PLANT_ID)).resolves.toBeUndefined();
      expect(prisma.plant.deleteMany).toHaveBeenCalledWith({
        where: { id: PLANT_ID, ownerId: OWNER },
      });
      expect(photos.remove).not.toHaveBeenCalled();
    });

    it('also deletes the photo file', async () => {
      prisma.plant.findFirst.mockResolvedValue({
        ...owned,
        photoKey: 'old.jpg',
      });
      prisma.plant.deleteMany.mockResolvedValue({ count: 1 });
      await service.remove(OWNER, PLANT_ID);
      expect(photos.remove).toHaveBeenCalledWith('old.jpg');
    });

    it("throws 404 for a missing or another user's plant", async () => {
      prisma.plant.findFirst.mockResolvedValue(null);
      await expect(service.remove(OWNER, PLANT_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.plant.deleteMany).not.toHaveBeenCalled();
    });

    it('throws 404 when the row disappeared before the delete', async () => {
      prisma.plant.findFirst.mockResolvedValue(owned);
      prisma.plant.deleteMany.mockResolvedValue({ count: 0 });
      await expect(service.remove(OWNER, PLANT_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws 404 for a malformed id without querying the database', async () => {
      await expect(service.remove(OWNER, 'nope')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.plant.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const owned = { id: PLANT_ID, ownerId: OWNER, photoKey: null };

    it('changes only the fields that were sent', async () => {
      prisma.plant.findFirst.mockResolvedValue(owned);
      prisma.plant.update.mockResolvedValue(owned);
      await service.update(OWNER, PLANT_ID, {
        name: 'Kitchen monstera',
        potSize: 'LARGE',
      });
      expect(prisma.plant.update).toHaveBeenCalledWith({
        where: { id: PLANT_ID },
        data: { name: 'Kitchen monstera', potSize: 'LARGE' },
      });
    });

    it('speciesId null removes the catalog link without a lookup', async () => {
      prisma.plant.findFirst.mockResolvedValue(owned);
      prisma.plant.update.mockResolvedValue(owned);
      await service.update(OWNER, PLANT_ID, { speciesId: null });
      expect(species.findById).not.toHaveBeenCalled();
      expect(prisma.plant.update).toHaveBeenCalledWith({
        where: { id: PLANT_ID },
        data: { speciesId: null },
      });
    });

    it('400 for an empty body, before any query', async () => {
      await expect(service.update(OWNER, PLANT_ID, {})).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.plant.findFirst).not.toHaveBeenCalled();
    });

    it('400 for an unknown speciesId; nothing is updated', async () => {
      prisma.plant.findFirst.mockResolvedValue(owned);
      species.findById.mockResolvedValue(null);
      await expect(
        service.update(OWNER, PLANT_ID, {
          speciesId: '33333333-3333-4333-8333-333333333333',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.plant.update).not.toHaveBeenCalled();
    });

    it("404 for another user's plant", async () => {
      prisma.plant.findFirst.mockResolvedValue(null);
      await expect(
        service.update(OWNER, PLANT_ID, { name: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setPhoto', () => {
    const PNG = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0,
    ]);

    it('saves the file, stores the key and deletes the old photo', async () => {
      prisma.plant.findFirst.mockResolvedValue({
        id: PLANT_ID,
        ownerId: OWNER,
        photoKey: 'old.jpg',
      });
      prisma.plant.update.mockResolvedValue({
        id: PLANT_ID,
        photoKey: 'new-key',
      });

      await service.setPhoto(OWNER, PLANT_ID, PNG);

      expect(photos.save).toHaveBeenCalledWith(PNG, 'png');
      expect(prisma.plant.update).toHaveBeenCalledWith({
        where: { id: PLANT_ID },
        data: { photoKey: 'new-key' },
      });
      expect(photos.remove).toHaveBeenCalledWith('old.jpg');
    });

    it('400 for a file that is not JPEG, PNG or WebP; nothing is saved', async () => {
      prisma.plant.findFirst.mockResolvedValue({
        id: PLANT_ID,
        photoKey: null,
      });
      await expect(
        service.setPhoto(OWNER, PLANT_ID, Buffer.from('<svg></svg>')),
      ).rejects.toThrow(BadRequestException);
      expect(photos.save).not.toHaveBeenCalled();
    });

    it('404 before reading the file when the plant is not owned', async () => {
      prisma.plant.findFirst.mockResolvedValue(null);
      await expect(service.setPhoto(OWNER, PLANT_ID, PNG)).rejects.toThrow(
        NotFoundException,
      );
      expect(photos.save).not.toHaveBeenCalled();
    });

    it('deletes the new file when the database update fails', async () => {
      prisma.plant.findFirst.mockResolvedValue({
        id: PLANT_ID,
        photoKey: null,
      });
      prisma.plant.update.mockRejectedValue(new Error('db down'));
      await expect(service.setPhoto(OWNER, PLANT_ID, PNG)).rejects.toThrow(
        'db down',
      );
      expect(photos.remove).toHaveBeenCalledWith('new-key');
    });
  });

  describe('removePhoto', () => {
    it('clears the key and deletes the file', async () => {
      prisma.plant.findFirst.mockResolvedValue({
        id: PLANT_ID,
        photoKey: 'old.jpg',
      });
      prisma.plant.update.mockResolvedValue({ id: PLANT_ID, photoKey: null });
      await service.removePhoto(OWNER, PLANT_ID);
      expect(prisma.plant.update).toHaveBeenCalledWith({
        where: { id: PLANT_ID },
        data: { photoKey: null },
      });
      expect(photos.remove).toHaveBeenCalledWith('old.jpg');
    });

    it('does nothing when there is no photo', async () => {
      const plant = { id: PLANT_ID, photoKey: null };
      prisma.plant.findFirst.mockResolvedValue(plant);
      await expect(service.removePhoto(OWNER, PLANT_ID)).resolves.toBe(plant);
      expect(prisma.plant.update).not.toHaveBeenCalled();
    });
  });
});
