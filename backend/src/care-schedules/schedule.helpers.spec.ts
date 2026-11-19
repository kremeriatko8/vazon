import {
  baseIntervalDays,
  daysBetween,
  dueDate,
  feedingSeasonDue,
  kyivDateString,
  minDaysBetweenActions,
  type SchedulePlant,
  seasonFor,
  waterAmountMl,
} from './schedule.engine.js';

const plant = (waterNeed?: SchedulePlant['waterNeed']): SchedulePlant => ({
  lightCondition: 'MEDIUM',
  potSize: 'MEDIUM',
  radiatorDistance: 'NONE',
  waterNeed,
});

describe('water need', () => {
  it('waters a cactus (LOW) far less often than a fern (HIGH)', () => {
    const cactus = baseIntervalDays(plant('LOW'), 'WATER');
    const fern = baseIntervalDays(plant('HIGH'), 'WATER');
    const usual = baseIntervalDays(plant('MEDIUM'), 'WATER');
    expect(cactus).toBeGreaterThan(usual);
    expect(fern).toBeLessThan(usual);
  });

  it('treats a plant without a species as MEDIUM', () => {
    expect(baseIntervalDays(plant(undefined), 'WATER')).toBe(
      baseIntervalDays(plant('MEDIUM'), 'WATER'),
    );
  });

  it('feeds cacti and succulents (LOW) half as often', () => {
    expect(baseIntervalDays(plant('LOW'), 'FEED')).toBe(
      2 * baseIntervalDays(plant('MEDIUM'), 'FEED'),
    );
    expect(baseIntervalDays(plant('HIGH'), 'FEED')).toBe(
      baseIntervalDays(plant('MEDIUM'), 'FEED'),
    );
  });
});

describe('seasonFor (Europe/Kyiv)', () => {
  it.each([
    ['2026-01-15T12:00:00Z', 'WINTER'],
    ['2026-03-01T12:00:00Z', 'SPRING'],
    ['2026-07-10T12:00:00Z', 'SUMMER'],
    ['2026-11-19T12:00:00Z', 'AUTUMN'],
    ['2026-12-01T12:00:00Z', 'WINTER'],
    // 22:30 UTC on 30 Nov is already 1 Dec in Kyiv.
    ['2026-11-30T22:30:00Z', 'WINTER'],
  ])('%s is %s', (iso, season) => {
    expect(seasonFor(new Date(iso))).toBe(season);
  });
});

describe('Kyiv days', () => {
  it('uses the Kyiv calendar day, not the UTC one', () => {
    expect(kyivDateString(new Date('2026-11-18T22:30:00Z'))).toBe('2026-11-19');
  });

  it('counts calendar days between two moments', () => {
    expect(
      daysBetween(
        new Date('2026-11-18T08:00:00Z'),
        new Date('2026-11-18T20:00:00Z'),
      ),
    ).toBe(0);
    expect(
      daysBetween(
        new Date('2026-11-18T08:00:00Z'),
        new Date('2026-11-20T08:00:00Z'),
      ),
    ).toBe(2);
  });
});

describe('dueDate', () => {
  it('can be in the past (overdue), unlike computeNextDue', () => {
    const due = dueDate({
      plant: plant('MEDIUM'),
      taskType: 'WATER',
      lastDoneDate: new Date('2026-04-01T00:00:00Z'),
      season: 'SPRING',
      soilWetCount: 0,
    });
    expect(due.toISOString().slice(0, 10)).toBe('2026-04-08');
  });
});

describe('waterAmountMl', () => {
  it('grows with the pot and halves for LOW water need', () => {
    const small = waterAmountMl({ potSize: 'SMALL' });
    const large = waterAmountMl({ potSize: 'LARGE' });
    expect(large.min).toBeGreaterThan(small.max);
    const cactus = waterAmountMl({ potSize: 'MEDIUM', waterNeed: 'LOW' });
    const usual = waterAmountMl({ potSize: 'MEDIUM', waterNeed: 'MEDIUM' });
    expect(cactus.max).toBe(usual.max / 2);
    expect(cactus.min % 10).toBe(0);
  });
});

describe('minDaysBetweenActions', () => {
  it('is half of the interval, at least one day', () => {
    expect(minDaysBetweenActions(7)).toBe(3);
    expect(minDaysBetweenActions(30)).toBe(15);
    expect(minDaysBetweenActions(1)).toBe(1);
  });
});

describe('feedingSeasonDue', () => {
  const at = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
  const day = (d: Date) => d.toISOString().slice(0, 10);

  it('keeps feeding dates in spring and summer', () => {
    expect(day(feedingSeasonDue(at('2026-05-10')))).toBe('2026-05-10');
    expect(day(feedingSeasonDue(at('2026-09-30')))).toBe('2026-09-30');
  });

  it('moves autumn and winter feeding to 1 March', () => {
    expect(day(feedingSeasonDue(at('2026-11-19')))).toBe('2027-03-01');
    expect(day(feedingSeasonDue(at('2027-01-05')))).toBe('2027-03-01');
    expect(day(feedingSeasonDue(at('2027-02-28')))).toBe('2027-03-01');
  });
});
