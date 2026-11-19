import { ConflictException, Injectable } from '@nestjs/common';
import type { CareActionType } from '../generated/prisma/enums.js';
import { PlantsService } from '../plants/plants.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { guessWaterNeed } from '../species/plant-name-hints.js';
import type {
  CareTaskDto,
  CareTaskStatusValue,
  ScheduledTaskType,
} from './dto/care-task.dto.js';
import {
  daysBetween,
  dueDate,
  feedingSeasonDue,
  intervalDays,
  kyivDateString,
  kyivDay,
  minDaysBetweenActions,
  type SchedulePlant,
  seasonFor,
  waterAmountMl,
} from './schedule.engine.js';
import { learnWaterFactor } from './personalization.js';

/** The care-history fields the schedule needs. */
export interface HistoryEntry {
  actionType: CareActionType;
  actionDate: Date;
}

/** Action logged when a scheduled task is done. */
const ACTION_FOR_TASK: Record<ScheduledTaskType, CareActionType> = {
  WATER: 'WATERED',
  FEED: 'FED',
};

const TASK_FOR_ACTION: Partial<Record<CareActionType, ScheduledTaskType>> = {
  WATERED: 'WATER',
  FED: 'FEED',
};

interface PlantForSchedule extends SchedulePlant {
  id: string;
  name: string;
  species: string;
  createdAt: Date;
}

interface TaskTiming {
  lastDoneAt: Date | null;
  interval: number;
  /** "YYYY-MM-DD", Europe/Kyiv. */
  due: string;
  /** True when a FEED task was moved out of the winter rest period. */
  restPeriod: boolean;
  /** WATER interval factor learned from this plant's history (1 = nothing learned). */
  personalFactor: number;
  /** Watering cycles the factor was learned from. */
  learnedCycles: number;
}

/**
 * Builds care tasks from the schedule engine and guards care actions that are
 * logged too early. Reads only the current owner's data.
 */
@Injectable()
export class CareTasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plants: PlantsService,
  ) {}

  /** WATER and FEED tasks for every plant of the owner, soonest first. */
  async findForOwner(
    ownerId: string,
    now = new Date(),
  ): Promise<CareTaskDto[]> {
    const plants = await this.prisma.plant.findMany({
      // Dead plants get no tasks.
      where: { ownerId, status: { not: 'DEAD' } },
      include: { speciesInfo: { select: { waterNeed: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const history = await this.prisma.careHistory.findMany({
      where: {
        plant: { ownerId },
        actionType: { in: ['WATERED', 'FED', 'SOIL_WET'] },
      },
      select: { plantId: true, actionType: true, actionDate: true },
      orderBy: [{ actionDate: 'desc' }, { createdAt: 'desc' }],
    });

    const byPlant = new Map<string, HistoryEntry[]>();
    for (const entry of history) {
      const list = byPlant.get(entry.plantId) ?? [];
      list.push(entry);
      byPlant.set(entry.plantId, list);
    }

    const today = kyivDateString(now);
    const tasks: CareTaskDto[] = [];
    for (const row of plants) {
      const need = resolveWaterNeed(row, row.speciesInfo?.waterNeed);
      const plant = toSchedulePlant(row, need.waterNeed);
      const entries = byPlant.get(row.id) ?? [];
      for (const taskType of ['WATER', 'FEED'] as const) {
        const timing = taskTiming(plant, taskType, entries, now);
        tasks.push({
          plantId: plant.id,
          plantName: plant.name,
          species: plant.species,
          taskType,
          lastDoneAt: timing.lastDoneAt?.toISOString() ?? null,
          nextDueDate: timing.due,
          intervalDays: timing.interval,
          status: statusFor(timing.due, today),
          restPeriod: timing.restPeriod,
          waterNeed: need.waterNeed,
          waterNeedSource: need.source,
          personalFactor: timing.personalFactor,
          learnedCycles: timing.learnedCycles,
          ...(taskType === 'WATER'
            ? { waterAmountMl: waterAmountMl(plant) }
            : {}),
        });
      }
    }
    return tasks.sort(
      (a, b) =>
        a.nextDueDate.localeCompare(b.nextDueDate) ||
        a.plantName.localeCompare(b.plantName),
    );
  }

  /**
   * Throws 404 if the plant is not the owner's, and 409 if the action comes
   * too early: WATERED or FED within half of the interval (unless `confirm`),
   * or a second SOIL_WET on the same day (never overridable).
   */
  async assertCanLog(
    ownerId: string,
    plantId: string,
    actionType: CareActionType,
    confirm: boolean,
    now = new Date(),
  ): Promise<void> {
    const owned = await this.plants.findOwnedOrThrow(ownerId, plantId);
    if (owned.status === 'DEAD') {
      throw new ConflictException({
        statusCode: 409,
        code: 'PLANT_DEAD',
        error: 'Conflict',
        message:
          'The plant is marked as dead. Change its status to log care again.',
      });
    }
    const taskType = TASK_FOR_ACTION[actionType];
    if (actionType !== 'SOIL_WET' && (!taskType || confirm)) return;

    const entries: HistoryEntry[] = await this.prisma.careHistory.findMany({
      where: { plantId, actionType: { in: ['WATERED', 'FED', 'SOIL_WET'] } },
      select: { actionType: true, actionDate: true },
      orderBy: [{ actionDate: 'desc' }, { createdAt: 'desc' }],
    });

    if (actionType === 'SOIL_WET') {
      const today = kyivDateString(now);
      if (
        entries.some(
          (e) =>
            e.actionType === 'SOIL_WET' &&
            kyivDateString(e.actionDate) === today,
        )
      ) {
        throw new ConflictException({
          statusCode: 409,
          code: 'ALREADY_LOGGED_TODAY',
          error: 'Conflict',
          message: 'The soil check is already logged today.',
        });
      }
      return;
    }

    if (!taskType) return;
    const species = owned.speciesId
      ? await this.prisma.species.findUnique({
          where: { id: owned.speciesId },
          select: { waterNeed: true },
        })
      : null;
    const plant = toSchedulePlant(
      owned,
      resolveWaterNeed(owned, species?.waterNeed).waterNeed,
    );
    const timing = taskTiming(plant, taskType, entries, now);
    if (!timing.lastDoneAt) return;

    const daysAgo = daysBetween(timing.lastDoneAt, now);
    if (daysAgo >= minDaysBetweenActions(timing.interval)) return;

    throw new ConflictException({
      statusCode: 409,
      code: 'TOO_EARLY',
      error: 'Conflict',
      message: tooEarlyMessage(taskType, daysAgo, timing.due),
      lastDoneAt: timing.lastDoneAt.toISOString(),
      nextDueDate: timing.due,
    });
  }
}

export type WaterNeedSource = 'CATALOG' | 'NAME' | 'DEFAULT';

/**
 * The plant's water need: from the linked catalog species; otherwise guessed
 * from the species and plant names people type ("кактус", "fern"); otherwise
 * MEDIUM.
 */
export function resolveWaterNeed(
  row: { species: string; name: string },
  catalog: SchedulePlant['waterNeed'] | null | undefined,
): {
  waterNeed: NonNullable<SchedulePlant['waterNeed']>;
  source: WaterNeedSource;
} {
  if (catalog) return { waterNeed: catalog, source: 'CATALOG' };
  const guessed = guessWaterNeed(`${row.species} ${row.name}`);
  if (guessed) return { waterNeed: guessed, source: 'NAME' };
  return { waterNeed: 'MEDIUM', source: 'DEFAULT' };
}

function toSchedulePlant(
  row: Omit<PlantForSchedule, 'waterNeed'>,
  waterNeed: SchedulePlant['waterNeed'] | undefined,
): PlantForSchedule {
  return {
    id: row.id,
    name: row.name,
    species: row.species,
    createdAt: row.createdAt,
    lightCondition: row.lightCondition,
    potSize: row.potSize,
    radiatorDistance: row.radiatorDistance,
    waterNeed: waterNeed ?? 'MEDIUM',
  };
}

/**
 * Last done date, interval and due day for one task. `entries` are this
 * plant's WATERED / FED / SOIL_WET entries, newest first. Without any entry
 * the plant's creation date is the start of the first cycle.
 */
export function taskTiming(
  plant: PlantForSchedule,
  taskType: ScheduledTaskType,
  entries: readonly HistoryEntry[],
  now: Date,
): TaskTiming {
  const action = ACTION_FOR_TASK[taskType];
  const last = entries.find((e) => e.actionType === action) ?? null;
  const cycleStart = last?.actionDate ?? plant.createdAt;
  const soilWetCount =
    taskType === 'WATER'
      ? entries.filter(
          (e) =>
            e.actionType === 'SOIL_WET' &&
            e.actionDate.getTime() > cycleStart.getTime(),
        ).length
      : 0;
  const personal =
    taskType === 'WATER'
      ? learnWaterFactor(entries, (start) =>
          intervalDays({
            plant,
            taskType,
            lastDoneDate: kyivDay(start),
            season: seasonFor(start),
            soilWetCount: 0,
          }),
        )
      : { factor: 1, cycles: 0 };
  const input = {
    plant,
    taskType,
    lastDoneDate: kyivDay(cycleStart),
    season: seasonFor(now),
    soilWetCount,
    personalFactor: personal.factor,
  };
  const due = dueDate(input);
  const seasonal = taskType === 'FEED' ? feedingSeasonDue(due) : due;
  return {
    lastDoneAt: last?.actionDate ?? null,
    interval: intervalDays(input),
    due: seasonal.toISOString().slice(0, 10),
    restPeriod: seasonal.getTime() !== due.getTime(),
    personalFactor: personal.factor,
    learnedCycles: personal.cycles,
  };
}

function statusFor(due: string, today: string): CareTaskStatusValue {
  if (due < today) return 'OVERDUE';
  if (due === today) return 'TODAY';
  return 'UPCOMING';
}

function tooEarlyMessage(
  taskType: ScheduledTaskType,
  daysAgo: number,
  due: string,
): string {
  const verb = taskType === 'WATER' ? 'Watered' : 'Fed';
  const when =
    daysAgo <= 0
      ? 'today'
      : daysAgo === 1
        ? 'yesterday'
        : `${daysAgo} days ago`;
  const next = taskType === 'WATER' ? 'watering' : 'feeding';
  return `${verb} ${when}. Next ${next} is due on ${due}.`;
}
