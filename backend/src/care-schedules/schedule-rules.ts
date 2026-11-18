import type {
  CareTaskType,
  LightCondition,
  PotSize,
  RadiatorDistance,
  WaterNeed,
} from '../generated/prisma/enums.js';

/**
 * Placeholder care rules for the schedule engine.
 *
 * Every number here is a PLACEHOLDER. Each one is listed in docs/care-rules.md
 * with the status "to verify". Do not treat these values as horticultural
 * facts until a human has checked them against a reliable source and updated
 * that file.
 *
 * The interval for a plant is computed as:
 *   base     = BASE_INTERVAL_DAYS[task] * WATER_NEED_FACTOR[task][need] * LIGHT_FACTOR[task][light] * POT_SIZE_FACTOR[task][pot]
 *   adjusted = base * radiator factor (WATER only) * season factor (WATER and FEED only)
 * Factors below 1 shorten the interval; factors above 1 lengthen it.
 */

export type Season = 'WINTER' | 'SPRING' | 'SUMMER' | 'AUTUMN';

/** Base interval in days for a neutral plant (MEDIUM light, MEDIUM pot). */
export const BASE_INTERVAL_DAYS: Readonly<Record<CareTaskType, number>> = {
  WATER: 7, // to verify, see docs/care-rules.md
  FEED: 30, // to verify, see docs/care-rules.md
  REPOT: 365, // to verify, see docs/care-rules.md
};

/** Multiplier on the base interval per light condition, per task type. */
export const LIGHT_FACTOR: Readonly<
  Record<CareTaskType, Readonly<Record<LightCondition, number>>>
> = {
  WATER: {
    LOW: 1.5, // to verify, see docs/care-rules.md
    MEDIUM: 1, // to verify, see docs/care-rules.md
    BRIGHT_INDIRECT: 0.85, // to verify, see docs/care-rules.md
    DIRECT: 0.7, // to verify, see docs/care-rules.md
  },
  FEED: {
    LOW: 1, // to verify, see docs/care-rules.md
    MEDIUM: 1, // to verify, see docs/care-rules.md
    BRIGHT_INDIRECT: 1, // to verify, see docs/care-rules.md
    DIRECT: 1, // to verify, see docs/care-rules.md
  },
  REPOT: {
    LOW: 1, // to verify, see docs/care-rules.md
    MEDIUM: 1, // to verify, see docs/care-rules.md
    BRIGHT_INDIRECT: 1, // to verify, see docs/care-rules.md
    DIRECT: 1, // to verify, see docs/care-rules.md
  },
};

/** Multiplier on the base interval per pot size, per task type. */
export const POT_SIZE_FACTOR: Readonly<
  Record<CareTaskType, Readonly<Record<PotSize, number>>>
> = {
  WATER: {
    SMALL: 0.75, // to verify, see docs/care-rules.md
    MEDIUM: 1, // to verify, see docs/care-rules.md
    LARGE: 1.25, // to verify, see docs/care-rules.md
  },
  FEED: {
    SMALL: 1, // to verify, see docs/care-rules.md
    MEDIUM: 1, // to verify, see docs/care-rules.md
    LARGE: 1, // to verify, see docs/care-rules.md
  },
  REPOT: {
    SMALL: 1, // to verify, see docs/care-rules.md
    MEDIUM: 1, // to verify, see docs/care-rules.md
    LARGE: 1, // to verify, see docs/care-rules.md
  },
};

/** Multiplier for the distance to the nearest radiator. Applied to WATER only. */
export const RADIATOR_FACTOR: Readonly<Record<RadiatorDistance, number>> = {
  NEAR: 0.8, // to verify, see docs/care-rules.md
  MEDIUM: 1, // to verify, see docs/care-rules.md
  FAR: 1, // to verify, see docs/care-rules.md
  NONE: 1, // to verify, see docs/care-rules.md
};

/** Task types the radiator factor applies to. */
export const RADIATOR_ADJUSTED_TASKS: ReadonlySet<CareTaskType> = new Set([
  'WATER',
]);

/** Multiplier per season. Applied to the task types in SEASON_ADJUSTED_TASKS only. */
export const SEASON_FACTOR: Readonly<Record<Season, number>> = {
  WINTER: 1.5, // to verify, see docs/care-rules.md
  SPRING: 1, // to verify, see docs/care-rules.md
  SUMMER: 1, // to verify, see docs/care-rules.md
  AUTUMN: 1, // to verify, see docs/care-rules.md
};

/** Task types the season factor applies to. */
export const SEASON_ADJUSTED_TASKS: ReadonlySet<CareTaskType> = new Set([
  'WATER',
  'FEED',
]);

/** Days added to the next WATER for each "soil still wet" response in the current cycle. */
export const SOIL_WET_POSTPONE_DAYS = 1; // decided, pending team confirmation, see docs/care-rules.md

/** The most days that "soil still wet" responses can add to one WATER cycle in total. */
export const SOIL_WET_MAX_CYCLE_DAYS = 2; // decided, pending team confirmation, see docs/care-rules.md

/** The shortest interval the engine will ever return, in days. */
export const MIN_INTERVAL_DAYS = 1; // to verify, see docs/care-rules.md

/**
 * Multiplier on the base interval per species water need, per task type.
 * A plant without a catalog species counts as MEDIUM.
 */
export const WATER_NEED_FACTOR: Readonly<
  Record<CareTaskType, Readonly<Record<WaterNeed, number>>>
> = {
  WATER: {
    LOW: 2.5, // to verify, see docs/care-rules.md
    MEDIUM: 1, // to verify, see docs/care-rules.md
    HIGH: 0.7, // to verify, see docs/care-rules.md
  },
  FEED: {
    LOW: 1, // to verify, see docs/care-rules.md
    MEDIUM: 1, // to verify, see docs/care-rules.md
    HIGH: 1, // to verify, see docs/care-rules.md
  },
  REPOT: {
    LOW: 1, // to verify, see docs/care-rules.md
    MEDIUM: 1, // to verify, see docs/care-rules.md
    HIGH: 1, // to verify, see docs/care-rules.md
  },
};

/** Approximate water per watering, in millilitres, by pot size. */
export const WATER_AMOUNT_ML: Readonly<
  Record<PotSize, Readonly<{ min: number; max: number }>>
> = {
  SMALL: { min: 100, max: 200 }, // to verify, see docs/care-rules.md
  MEDIUM: { min: 300, max: 500 }, // to verify, see docs/care-rules.md
  LARGE: { min: 700, max: 1000 }, // to verify, see docs/care-rules.md
};

/** Multiplier on WATER_AMOUNT_ML per water need. */
export const WATER_AMOUNT_FACTOR: Readonly<Record<WaterNeed, number>> = {
  LOW: 0.5, // to verify, see docs/care-rules.md
  MEDIUM: 1, // to verify, see docs/care-rules.md
  HIGH: 1, // to verify, see docs/care-rules.md
};

/**
 * Logging WATERED or FED again is rejected (unless confirmed) when less than
 * this share of the current interval has passed since the last entry.
 */
export const TOO_EARLY_SHARE = 0.5; // decided by the team, see docs/care-rules.md

/** Time zone used for "today", seasons and the too-early rule. */
export const CARE_TIME_ZONE = 'Europe/Kyiv';
