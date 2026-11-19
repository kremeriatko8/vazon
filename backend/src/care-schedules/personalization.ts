import {
  PERSONAL_EARLY_DAYS,
  PERSONAL_FACTOR_MAX,
  PERSONAL_FACTOR_MIN,
  PERSONAL_MAX_CYCLES,
  PERSONAL_MAX_GAP_INTERVALS,
  PERSONAL_MIN_CYCLES,
} from './schedule-rules.js';
import { daysBetween } from './schedule.engine.js';

export interface PersonalEntry {
  actionType: string;
  actionDate: Date;
}

export interface PersonalFactor {
  /** Multiplies the WATER interval. 1 when nothing has been learned. */
  factor: number;
  /** Watering cycles that gave evidence (soil still wet, or watered early). */
  cycles: number;
}

/**
 * Learns how fast this plant's soil dries from its own care history. Pure.
 *
 * A cycle is the time between two waterings. Only clear evidence counts:
 * - "soil still wet" k times during the cycle: the plant needed at least
 *   expected + k days, so ratio = max(gap, expected + k) / expected;
 * - watered at least PERSONAL_EARLY_DAYS before the due day without a
 *   "soil still wet": the soil dried sooner, so ratio = gap / expected.
 * Watering on time or late says nothing about the plant (people are busy),
 * and gaps longer than PERSONAL_MAX_GAP_INTERVALS intervals are skipped.
 *
 * The factor is the median ratio of the last PERSONAL_MAX_CYCLES cycles with
 * evidence, clamped to [PERSONAL_FACTOR_MIN, PERSONAL_FACTOR_MAX], and is 1
 * until there are PERSONAL_MIN_CYCLES such cycles.
 *
 * `expectedInterval(start)` is the interval the engine gave for a cycle that
 * started at `start`, without any personal factor (no feedback loop).
 */
export function learnWaterFactor(
  entries: readonly PersonalEntry[],
  expectedInterval: (cycleStart: Date) => number,
): PersonalFactor {
  const byTime = [...entries].sort(
    (a, b) => a.actionDate.getTime() - b.actionDate.getTime(),
  );
  const waterings = byTime.filter((e) => e.actionType === 'WATERED');
  const ratios: number[] = [];

  for (let i = 1; i < waterings.length; i += 1) {
    const start = waterings[i - 1].actionDate;
    const end = waterings[i].actionDate;
    const gap = daysBetween(start, end);
    const expected = expectedInterval(start);
    if (gap <= 0 || expected <= 0) continue;
    if (gap > expected * PERSONAL_MAX_GAP_INTERVALS) continue;

    const soilWet = byTime.filter(
      (e) =>
        e.actionType === 'SOIL_WET' &&
        e.actionDate.getTime() > start.getTime() &&
        e.actionDate.getTime() < end.getTime(),
    ).length;

    if (soilWet > 0) {
      ratios.push(Math.max(gap, expected + soilWet) / expected);
    } else if (gap <= expected - PERSONAL_EARLY_DAYS) {
      ratios.push(gap / expected);
    }
  }

  const recent = ratios.slice(-PERSONAL_MAX_CYCLES);
  if (recent.length < PERSONAL_MIN_CYCLES) {
    return { factor: 1, cycles: recent.length };
  }
  const clamped = Math.min(
    PERSONAL_FACTOR_MAX,
    Math.max(PERSONAL_FACTOR_MIN, median(recent)),
  );
  return { factor: Math.round(clamped * 100) / 100, cycles: recent.length };
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
