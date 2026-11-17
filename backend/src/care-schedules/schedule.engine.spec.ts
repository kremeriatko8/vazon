import {
  BASE_INTERVAL_DAYS,
  RADIATOR_FACTOR,
  SEASON_FACTOR,
  SOIL_WET_MAX_CYCLE_DAYS,
} from './schedule-rules.js';
import {
  computeNextDue,
  type ComputeNextDueInput,
  type SchedulePlant,
} from './schedule.engine.js';

const DAY = 24 * 60 * 60 * 1000;

/** MEDIUM light, MEDIUM pot, no radiator: every factor is 1. */
const neutralPlant: SchedulePlant = {
  lightCondition: 'MEDIUM',
  potSize: 'MEDIUM',
  radiatorDistance: 'NONE',
};

const lastDone = new Date('2026-04-01T00:00:00.000Z');
/** `now` equal to lastDone, so the "never before now" rule does not interfere. */
const now = lastDone;

function input(
  overrides: Partial<ComputeNextDueInput> = {},
): ComputeNextDueInput {
  return {
    plant: neutralPlant,
    taskType: 'WATER',
    lastDoneDate: lastDone,
    season: 'SPRING',
    soilWetCount: 0,
    ...overrides,
  };
}

function daysAfterLastDone(due: Date): number {
  return (due.getTime() - lastDone.getTime()) / DAY;
}

describe('computeNextDue', () => {
  describe('base interval with a neutral plant', () => {
    it.each(['WATER', 'FEED', 'REPOT'] as const)(
      'uses the base interval for %s',
      (taskType) => {
        const due = computeNextDue(input({ taskType }), now);
        expect(daysAfterLastDone(due)).toBe(BASE_INTERVAL_DAYS[taskType]);
      },
    );
  });

  describe('radiator distance', () => {
    it('NEAR shortens the watering interval', () => {
      expect(RADIATOR_FACTOR.NEAR).toBeLessThan(1);
      const due = computeNextDue(
        input({ plant: { ...neutralPlant, radiatorDistance: 'NEAR' } }),
        now,
      );
      expect(daysAfterLastDone(due)).toBeLessThan(BASE_INTERVAL_DAYS.WATER);
      expect(daysAfterLastDone(due)).toBe(
        Math.round(BASE_INTERVAL_DAYS.WATER * RADIATOR_FACTOR.NEAR),
      );
    });

    it.each(['FAR', 'NONE'] as const)(
      '%s keeps the base watering interval',
      (radiatorDistance) => {
        const due = computeNextDue(
          input({ plant: { ...neutralPlant, radiatorDistance } }),
          now,
        );
        expect(daysAfterLastDone(due)).toBe(BASE_INTERVAL_DAYS.WATER);
      },
    );
  });

  describe('season', () => {
    it.each(['WATER', 'FEED'] as const)(
      'winter lengthens the %s interval',
      (taskType) => {
        expect(SEASON_FACTOR.WINTER).toBeGreaterThan(1);
        const due = computeNextDue(input({ taskType, season: 'WINTER' }), now);
        expect(daysAfterLastDone(due)).toBeGreaterThan(
          BASE_INTERVAL_DAYS[taskType],
        );
        expect(daysAfterLastDone(due)).toBe(
          Math.round(BASE_INTERVAL_DAYS[taskType] * SEASON_FACTOR.WINTER),
        );
      },
    );

    it('winter does not change the repot interval', () => {
      const due = computeNextDue(
        input({ taskType: 'REPOT', season: 'WINTER' }),
        now,
      );
      expect(daysAfterLastDone(due)).toBe(BASE_INTERVAL_DAYS.REPOT);
    });
  });

  describe('soilWetCount', () => {
    const base = BASE_INTERVAL_DAYS.WATER;

    it('0 responses: no change from the base interval', () => {
      const due = computeNextDue(input({ soilWetCount: 0 }), now);
      expect(daysAfterLastDone(due)).toBe(base);
    });

    it('1 response: +1 day for a plain plant', () => {
      const due = computeNextDue(input({ soilWetCount: 1 }), now);
      expect(daysAfterLastDone(due)).toBe(base + 1);
      expect(due.toISOString()).toBe('2026-04-09T00:00:00.000Z');
    });

    it('2 responses: +2 days', () => {
      const due = computeNextDue(input({ soilWetCount: 2 }), now);
      expect(daysAfterLastDone(due)).toBe(base + 2);
    });

    it('5 responses: still +2 days (cap per cycle)', () => {
      expect(SOIL_WET_MAX_CYCLE_DAYS).toBe(2);
      const due = computeNextDue(input({ soilWetCount: 5 }), now);
      expect(daysAfterLastDone(due)).toBe(base + SOIL_WET_MAX_CYCLE_DAYS);
    });

    it('adds to an already adjusted interval (winter)', () => {
      const winter = Math.round(base * SEASON_FACTOR.WINTER);
      const due = computeNextDue(
        input({ season: 'WINTER', soilWetCount: 1 }),
        now,
      );
      expect(daysAfterLastDone(due)).toBe(winter + 1);
    });

    it.each(['FEED', 'REPOT'] as const)(
      'applies to WATER only: %s is unchanged',
      (taskType) => {
        const due = computeNextDue(input({ taskType, soilWetCount: 2 }), now);
        expect(daysAfterLastDone(due)).toBe(BASE_INTERVAL_DAYS[taskType]);
      },
    );

    it.each([-1, 1.5, Number.NaN])('throws for an invalid count (%s)', (n) => {
      expect(() => computeNextDue(input({ soilWetCount: n }), now)).toThrow(
        RangeError,
      );
    });

    it('result is never earlier than now, even with postponement', () => {
      const later = new Date('2026-06-15T14:45:00.000Z');
      const due = computeNextDue(input({ soilWetCount: 2 }), later);
      expect(due.toISOString()).toBe('2026-06-15T00:00:00.000Z');
    });
  });

  describe('never before now', () => {
    it('returns the start of the current UTC day when the computed date is in the past', () => {
      const later = new Date('2026-06-15T14:45:00.000Z');
      const due = computeNextDue(input(), later);
      expect(due.toISOString()).toBe('2026-06-15T00:00:00.000Z');
    });

    it('returns the computed date when it is in the future', () => {
      const due = computeNextDue(input(), new Date('2026-04-03T10:00:00.000Z'));
      expect(due.toISOString()).toBe('2026-04-08T00:00:00.000Z');
    });
  });

  describe('UTC day boundary', () => {
    it('uses the UTC day even when the Kyiv local day is already the next day', () => {
      // 01:30 on 11 March in Kyiv (UTC+2) is 23:30 on 10 March in UTC.
      const kyivAfterMidnight = new Date('2026-03-11T01:30:00+02:00');
      expect(kyivAfterMidnight.toISOString()).toBe('2026-03-10T23:30:00.000Z');

      const due = computeNextDue(
        input({ lastDoneDate: kyivAfterMidnight }),
        new Date('2026-03-10T00:00:00.000Z'),
      );
      // UTC day 10 March + 7 days = 17 March, at 00:00 UTC.
      expect(due.toISOString()).toBe('2026-03-17T00:00:00.000Z');
    });

    it('always returns a time of 00:00:00.000 UTC', () => {
      const due = computeNextDue(
        input({ lastDoneDate: new Date('2026-05-20T18:59:59.999Z') }),
        new Date('2026-05-20T00:00:00.000Z'),
      );
      expect(due.toISOString()).toBe('2026-05-27T00:00:00.000Z');
    });
  });
});
