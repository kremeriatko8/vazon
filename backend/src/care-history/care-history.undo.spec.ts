import { ConflictException, NotFoundException } from '@nestjs/common';
import type { PlantsService } from '../plants/plants.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { CareHistoryService } from './care-history.service.js';

const OWNER = '11111111-1111-4111-8111-111111111111';
const PLANT_ID = '22222222-2222-4222-8222-222222222222';
const ENTRY_ID = '33333333-3333-4333-8333-333333333333';
const NOW = new Date('2026-11-19T12:00:00Z');

function setup(createdAt: Date | null) {
  const prisma = {
    careHistory: {
      findFirst: vi
        .fn()
        .mockResolvedValue(createdAt ? { id: ENTRY_ID, createdAt } : null),
      delete: vi.fn().mockResolvedValue({}),
    },
  };
  const plants = {
    findOwnedOrThrow: vi.fn().mockResolvedValue({ id: PLANT_ID }),
  };
  const service = new CareHistoryService(
    prisma as unknown as PrismaService,
    plants as unknown as PlantsService,
  );
  return { prisma, plants, service };
}

describe('CareHistoryService.remove (undo)', () => {
  it('deletes an entry logged a few hours ago', async () => {
    const { prisma, service } = setup(new Date('2026-11-19T09:00:00Z'));
    await service.remove(OWNER, PLANT_ID, ENTRY_ID, NOW);
    expect(prisma.careHistory.findFirst).toHaveBeenCalledWith({
      where: { id: ENTRY_ID, plantId: PLANT_ID },
    });
    expect(prisma.careHistory.delete).toHaveBeenCalledWith({
      where: { id: ENTRY_ID },
    });
  });

  it('refuses entries older than 24 hours', async () => {
    const { prisma, service } = setup(new Date('2026-11-18T11:00:00Z'));
    const error = await service
      .remove(OWNER, PLANT_ID, ENTRY_ID, NOW)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ConflictException);
    expect(
      ((error as ConflictException).getResponse() as { code: string }).code,
    ).toBe('UNDO_EXPIRED');
    expect(prisma.careHistory.delete).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing entry or a malformed id', async () => {
    const { service } = setup(null);
    await expect(
      service.remove(OWNER, PLANT_ID, ENTRY_ID, NOW),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.remove(OWNER, PLANT_ID, 'not-a-uuid', NOW),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns 404 for another user's plant before reading entries", async () => {
    const { prisma, plants, service } = setup(new Date());
    plants.findOwnedOrThrow.mockRejectedValue(new NotFoundException());
    await expect(
      service.remove(OWNER, PLANT_ID, ENTRY_ID, NOW),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.careHistory.findFirst).not.toHaveBeenCalled();
  });
});
