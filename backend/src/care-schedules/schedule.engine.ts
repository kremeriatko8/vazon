import type {
  CareTaskType,
  LightCondition,
  PotSize,
  RadiatorDistance,
} from '../generated/prisma/enums.js';
import {
  BASE_INTERVAL_DAYS,
  LIGHT_FACTOR,
  MIN_INTERVAL_DAYS,
  POT_SIZE_FACTOR,
  RADIATOR_ADJUSTED_TASKS,
  RADIATOR_FACTOR,
  SEASON_ADJUSTED_TASKS,
  SEASON_FACTOR,
  SOIL_WET_POSTPONE_DAYS,
  type Season,
} from './schedule-rules.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface SchedulePlant {
  lightCondition: LightCondition;
  potSize: PotSize;
  radiatorDistance: RadiatorDistance;
}

export interface ComputeNextDueInput {
  plant: SchedulePlant;
  taskType: CareTaskType;
  lastDoneDate: Date;
  season: Season;
  feedback?: 'SOIL_WET' | null;
}

/** Returns 00:00 UTC of the UTC calendar day that contains `date`. */
export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

/**
 * The base interval in days for this plant and task: the neutral interval
 * adjusted for light condition and pot size, before radiator, season and
 * feedback adjustments.
 */
export function baseIntervalDays(
  plant: SchedulePlant,
  taskType: CareTaskType,
): number {
  const raw =
    BASE_INTERVAL_DAYS[taskType] *
    LIGHT_FACTOR[taskType][plant.lightCondition] *
    POT_SIZE_FACTOR[taskType][plant.potSize];
  return Math.max(MIN_INTERVAL_DAYS, Math.round(raw));
}

/**
 * The interval in days after every adjustment: radiator (WATER only),
 * season, and SOIL_WET feedback (WATER only).
 *
 * SOIL_WET adds SOIL_WET_POSTPONE_DAYS, but the result never exceeds the base
 * interval, and the postponement never shortens an interval that is
 * already longer than the base (for example, in winter).
 */
export function intervalDays(input: ComputeNextDueInput): number {
  const { plant, taskType, season, feedback } = input;
  const base = baseIntervalDays(plant, taskType);

  let factor = 1;
  if (RADIATOR_ADJUSTED_TASKS.has(taskType)) {
    factor *= RADIATOR_FACTOR[plant.radiatorDistance];
  }
  if (SEASON_ADJUSTED_TASKS.has(taskType)) {
    factor *= SEASON_FACTOR[season];
  }
  let days = Math.max(MIN_INTERVAL_DAYS, Math.round(base * factor));

  if (feedback === 'SOIL_WET' && taskType === 'WATER') {
    days = Math.max(days, Math.min(days + SOIL_WET_POSTPONE_DAYS, base));
  }
  return days;
}

/**
 * Computes the next due date for a care task. Pure: no database access and
 * no reading of the system clock. The caller passes `now`.
 *
 * All arithmetic is in UTC. The result is 00:00 UTC of the due day, and is
 * never earlier than 00:00 UTC of `now`'s day.
 */
export function computeNextDue(input: ComputeNextDueInput, now: Date): Date {
  const due = addUtcDays(
    startOfUtcDay(input.lastDoneDate),
    intervalDays(input),
  );
  const today = startOfUtcDay(now);
  return due.getTime() < today.getTime() ? today : due;
}
