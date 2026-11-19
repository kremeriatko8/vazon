import type {
  CareTaskType,
  LightCondition,
  PotSize,
  RadiatorDistance,
  WaterNeed,
} from '../generated/prisma/enums.js';
import {
  BASE_INTERVAL_DAYS,
  CARE_TIME_ZONE,
  FEED_MONTHS,
  LIGHT_FACTOR,
  MIN_INTERVAL_DAYS,
  POT_SIZE_FACTOR,
  RADIATOR_ADJUSTED_TASKS,
  RADIATOR_FACTOR,
  SEASON_ADJUSTED_TASKS,
  SEASON_FACTOR,
  SOIL_WET_MAX_CYCLE_DAYS,
  SOIL_WET_POSTPONE_DAYS,
  TOO_EARLY_SHARE,
  WATER_AMOUNT_FACTOR,
  WATER_AMOUNT_ML,
  WATER_NEED_FACTOR,
  type Season,
} from './schedule-rules.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface SchedulePlant {
  lightCondition: LightCondition;
  potSize: PotSize;
  radiatorDistance: RadiatorDistance;
  /** Water need of the plant's catalog species. Missing means MEDIUM. */
  waterNeed?: WaterNeed;
}

export interface ComputeNextDueInput {
  plant: SchedulePlant;
  taskType: CareTaskType;
  lastDoneDate: Date;
  season: Season;
  /** Number of "soil still wet" responses in the current cycle. Non-negative integer. */
  soilWetCount: number;
  /**
   * Learned from this plant's own history (see personalization.ts). Multiplies
   * the WATER interval; 1 (the default) means nothing learned yet.
   */
  personalFactor?: number;
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
    WATER_NEED_FACTOR[taskType][plant.waterNeed ?? 'MEDIUM'] *
    LIGHT_FACTOR[taskType][plant.lightCondition] *
    POT_SIZE_FACTOR[taskType][plant.potSize];
  return Math.max(MIN_INTERVAL_DAYS, Math.round(raw));
}

/**
 * Days added to the WATER interval for "soil still wet" responses:
 * SOIL_WET_POSTPONE_DAYS per response, at most SOIL_WET_MAX_CYCLE_DAYS per cycle.
 * Throws a RangeError if the count is negative or not an integer.
 */
export function soilWetPostponeDays(soilWetCount: number): number {
  if (!Number.isInteger(soilWetCount) || soilWetCount < 0) {
    throw new RangeError(
      `soilWetCount must be a non-negative integer, got ${soilWetCount}`,
    );
  }
  return Math.min(
    soilWetCount * SOIL_WET_POSTPONE_DAYS,
    SOIL_WET_MAX_CYCLE_DAYS,
  );
}

/**
 * The interval in days after every adjustment: radiator (WATER only),
 * season, and soil-wet postponement (WATER only).
 *
 * The postponement is added after rounding, so it is always whole days.
 */
export function intervalDays(input: ComputeNextDueInput): number {
  const { plant, taskType, season, soilWetCount } = input;
  const postpone = soilWetPostponeDays(soilWetCount);
  const base = baseIntervalDays(plant, taskType);

  let factor = 1;
  if (RADIATOR_ADJUSTED_TASKS.has(taskType)) {
    factor *= RADIATOR_FACTOR[plant.radiatorDistance];
  }
  if (SEASON_ADJUSTED_TASKS.has(taskType)) {
    factor *= SEASON_FACTOR[season];
  }
  if (taskType === 'WATER') {
    factor *= input.personalFactor ?? 1;
  }
  const days = Math.max(MIN_INTERVAL_DAYS, Math.round(base * factor));

  return taskType === 'WATER' ? days + postpone : days;
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

/**
 * The due date without the "never before today" rule: 00:00 UTC of the day
 * of lastDoneDate plus the interval. Earlier than today means overdue.
 */
export function dueDate(input: ComputeNextDueInput): Date {
  return addUtcDays(startOfUtcDay(input.lastDoneDate), intervalDays(input));
}

const KYIV_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: CARE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** The calendar day of `date` in Europe/Kyiv, as "YYYY-MM-DD". */
export function kyivDateString(date: Date): string {
  return KYIV_DATE.format(date);
}

/** 00:00 UTC of the Europe/Kyiv calendar day of `date`. */
export function kyivDay(date: Date): Date {
  return new Date(`${kyivDateString(date)}T00:00:00.000Z`);
}

/** Whole calendar days (Europe/Kyiv) from `from` to `to`. */
export function daysBetween(from: Date, to: Date): number {
  return Math.round(
    (kyivDay(to).getTime() - kyivDay(from).getTime()) / MS_PER_DAY,
  );
}

/** Meteorological season of `date` in Europe/Kyiv. */
export function seasonFor(date: Date): Season {
  const month = Number(kyivDateString(date).slice(5, 7));
  if (month === 12 || month <= 2) return 'WINTER';
  if (month <= 5) return 'SPRING';
  if (month <= 8) return 'SUMMER';
  return 'AUTUMN';
}

/** Approximate water per watering in millilitres, rounded to tens. */
export function waterAmountMl(
  plant: Pick<SchedulePlant, 'potSize' | 'waterNeed'>,
): { min: number; max: number } {
  const range = WATER_AMOUNT_ML[plant.potSize];
  const factor = WATER_AMOUNT_FACTOR[plant.waterNeed ?? 'MEDIUM'];
  const round = (ml: number) => Math.round((ml * factor) / 10) * 10;
  return { min: round(range.min), max: round(range.max) };
}

/** Fewest days that must pass before the same action is logged again without confirming. */
export function minDaysBetweenActions(interval: number): number {
  return Math.max(1, Math.floor(interval * TOO_EARLY_SHARE));
}

/**
 * Moves a FEED due date out of the rest period: if its month is not in
 * FEED_MONTHS, returns 00:00 UTC of the 1st of the next allowed month.
 * Dates inside the feeding months are returned unchanged.
 */
export function feedingSeasonDue(due: Date): Date {
  let year = due.getUTCFullYear();
  let month = due.getUTCMonth() + 1;
  if (FEED_MONTHS.has(month)) return due;
  for (let i = 0; i < 12; i += 1) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    if (FEED_MONTHS.has(month)) {
      return new Date(Date.UTC(year, month - 1, 1));
    }
  }
  return due; // FEED_MONTHS is empty: no rest period
}
