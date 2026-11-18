import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import type { CareHistory } from '../generated/prisma/client.js';
import { PlantsService } from '../plants/plants.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateCareLogDto } from './dto/create-care-log.dto.js';

/** Newest first; createdAt breaks ties between entries with the same actionDate. */
/** How long after logging an entry the owner can still undo it. */
export const UNDO_WINDOW_HOURS = 24;

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

  /**
   * Deletes one entry of the owner's plant, so a mistaken tap can be undone.
   * Allowed only within UNDO_WINDOW_HOURS of logging it; older entries stay
   * as history. 404 if the plant or the entry is missing or not owned.
   */
  async remove(
    ownerId: string,
    plantId: string,
    entryId: string,
    now = new Date(),
  ): Promise<void> {
    await this.plants.findOwnedOrThrow(ownerId, plantId);
    const notFound = () => new NotFoundException('Care log entry not found');
    if (!isUUID(entryId)) throw notFound();
    const entry = await this.prisma.careHistory.findFirst({
      where: { id: entryId, plantId },
    });
    if (!entry) throw notFound();

    const ageMs = now.getTime() - entry.createdAt.getTime();
    if (ageMs > UNDO_WINDOW_HOURS * 60 * 60 * 1000) {
      throw new ConflictException({
        statusCode: 409,
        code: 'UNDO_EXPIRED',
        error: 'Conflict',
        message: `Entries can be undone only within ${UNDO_WINDOW_HOURS} hours.`,
      });
    }
    await this.prisma.careHistory.delete({ where: { id: entry.id } });
  }
}
