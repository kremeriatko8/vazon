import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { SpeciesService } from './species.service.js';

const ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

function createPrismaMock() {
  return { species: { findMany: vi.fn(), findUnique: vi.fn() } };
}

describe('SpeciesService (Prisma mocked)', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: SpeciesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.species.findMany.mockResolvedValue([]);
    service = new SpeciesService(prisma as unknown as PrismaService);
  });

  it('search matches botanical or common name, case-insensitive, A–Z', async () => {
    await service.search('monst', 5);
    expect(prisma.species.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { scientificName: { contains: 'monst', mode: 'insensitive' } },
          { commonName: { contains: 'monst', mode: 'insensitive' } },
        ],
      },
      orderBy: [{ commonName: 'asc' }, { scientificName: 'asc' }],
      take: 5,
    });
  });

  it('search without text lists the catalog with the default limit', async () => {
    await service.search(undefined);
    expect(prisma.species.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {}, take: 10 }),
    );
  });

  it('search treats an empty string like no search', async () => {
    await service.search('');
    expect(prisma.species.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('findById returns null for a malformed id without querying', async () => {
    await expect(service.findById('monstera')).resolves.toBeNull();
    expect(prisma.species.findUnique).not.toHaveBeenCalled();
  });

  it('findByIdOrThrow returns the species', async () => {
    const species = { id: ID };
    prisma.species.findUnique.mockResolvedValue(species);
    await expect(service.findByIdOrThrow(ID)).resolves.toBe(species);
  });

  it('findByIdOrThrow throws 404 for an unknown id', async () => {
    prisma.species.findUnique.mockResolvedValue(null);
    await expect(service.findByIdOrThrow(ID)).rejects.toThrow(
      NotFoundException,
    );
  });
});
