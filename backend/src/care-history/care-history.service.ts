import { Injectable } from '@nestjs/common';
import type { CareHistory } from '../generated/prisma/client.js';
import { PlantsService } from '../plants/plants.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateCareLogDto } from './dto/create-care-log.dto.js';

/** Newest first; createdAt breaks ties between entries with the same actionDate. */
const NEWEST_FIRST = [
  { actionDate: 'desc' as const },
  { createdAt: 'desc' as const },
];

/**
 * Reads and writes care_history. Every method takes the owner's id and goes
 * through PlantsService.findOwnedOrThrow (or filters by owner), so a user
 * never sees or changes another user's history.
 */
@Injectable()
export class CareHistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plants: PlantsService,
  ) {}

  /** Entries for one plant, newest first. 404 if the plant is missing or not owned. */
  async findForPlant(ownerId: string, plantId: string): Promise<CareHistory[]> {
    await this.plants.findOwnedOrThrow(ownerId, plantId);
    return this.prisma.careHistory.findMany({
      where: { plantId },
      orderBy: NEWEST_FIRST,
    });
  }

  /** Entries for all of the owner's plants, newest first. */
  findAllForOwner(ownerId: string): Promise<CareHistory[]> {
    return this.prisma.careHistory.findMany({
      where: { plant: { ownerId } },
      orderBy: NEWEST_FIRST,
    });
  }

  /** Logs one action. actionDate is set by the server (now, UTC). */
  async create(
    ownerId: string,
    plantId: string,
    dto: CreateCareLogDto,
  ): Promise<CareHistory> {
    await this.plants.findOwnedOrThrow(ownerId, plantId);
    const notes = dto.notes?.trim();
    return this.prisma.careHistory.create({
      data: {
        plantId,
        actionType: dto.actionType,
        actionDate: new Date(),
        notes: notes ? notes : null,
      },
    });
  }
}
