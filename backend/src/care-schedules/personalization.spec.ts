import { learnWaterFactor, type PersonalEntry } from './personalization.js';

const day = (n: number) => new Date(Date.UTC(2026, 8, 1 + n, 9));
const watered = (n: number): PersonalEntry => ({
  actionType: 'WATERED',
  actionDate: day(n),
});
const soilWet = (n: number): PersonalEntry => ({
  actionType: 'SOIL_WET',
  actionDate: day(n),
});
const every7 = () => 7;

describe('learnWaterFactor', () => {
  it('learns nothing without history', () => {
    expect(learnWaterFactor([], every7)).toEqual({ factor: 1, cycles: 0 });
  });

  it('ignores on-time and late waterings (people are busy)', () => {
    const entries = [watered(0), watered(7), watered(16), watered(25)];
    expect(learnWaterFactor(entries, every7)).toEqual({ factor: 1, cycles: 0 });
  });

  it('needs two cycles with evidence before adapting', () => {
    const entries = [watered(0), soilWet(7), watered(9)];
    expect(learnWaterFactor(entries, every7)).toEqual({ factor: 1, cycles: 1 });
  });

  it('lengthens the interval when the soil keeps being wet at checks', () => {
    // Wet at the check twice in a row; watered 2 days later each time.
    const entries = [
      watered(0),
      soilWet(7),
      soilWet(8),
      watered(9),
      soilWet(16),
      soilWet(17),
      watered(18),
    ];
    const learned = learnWaterFactor(entries, every7);
    expect(learned.cycles).toBe(2);
    expect(learned.factor).toBeCloseTo(9 / 7, 2);
  });

  it('shortens the interval when watered early again and again', () => {
    const entries = [watered(0), watered(4), watered(8), watered(12)];
    expect(learnWaterFactor(entries, every7)).toEqual({
      factor: 0.6,
      cycles: 3,
    });
  });

  it('uses the median, so one odd cycle does not decide', () => {
    const entries = [
      watered(0),
      watered(5), // early: 5/7
      watered(10), // early: 5/7
      soilWet(17),
      soilWet(18),
      soilWet(19),
      watered(20), // wet: 10/7
    ];
    expect(learnWaterFactor(entries, every7).factor).toBeCloseTo(5 / 7, 2);
  });

  it('skips long gaps such as holidays', () => {
    const entries = [watered(0), watered(30), watered(34), watered(38)];
    // 0 -> 30 is skipped; 30 -> 34 and 34 -> 38 are early (4/7).
    expect(learnWaterFactor(entries, every7)).toEqual({
      factor: 0.6,
      cycles: 2,
    });
  });

  it('never goes above 1.6', () => {
    const wet = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => soilWet(n));
    const entries = [watered(0), ...wet, watered(13)];
    const wet2 = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25].map((n) =>
      soilWet(n),
    );
    const learned = learnWaterFactor(
      [...entries, ...wet2, watered(26)],
      every7,
    );
    expect(learned.factor).toBe(1.6);
  });
});
