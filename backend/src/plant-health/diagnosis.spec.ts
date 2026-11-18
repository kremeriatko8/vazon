import { type DiagnosisContext, diagnose, MAX_CAUSES } from './diagnosis.js';
import { CAUSES, SYMPTOM_CODES, SYMPTOM_WEIGHTS } from './symptoms.catalog.js';

const usual: DiagnosisContext = {
  waterNeed: 'MEDIUM',
  lightCondition: 'MEDIUM',
  potSize: 'MEDIUM',
  radiatorDistance: 'NONE',
  wateringIntervalDays: 7,
  daysSinceWatered: 3,
  wateringsLast14Days: 2,
  soilWetLast14Days: 0,
};

describe('diagnose', () => {
  it('blames overwatering for a cactus watered too often with yellow leaves', () => {
    const [first] = diagnose(['YELLOW_LEAVES'], {
      ...usual,
      waterNeed: 'LOW',
      wateringIntervalDays: 18,
      wateringsLast14Days: 4,
    });
    expect(first.cause).toBe('OVERWATERING');
    expect(first.confidence).toBe('HIGH');
    expect(first.reasons.length).toBeGreaterThanOrEqual(2);
    expect(first.reasons[0].uk).toContain('4');
  });

  it('blames underwatering for wilting when the last watering is long overdue', () => {
    const [first] = diagnose(['WILTING'], { ...usual, daysSinceWatered: 15 });
    expect(first.cause).toBe('UNDERWATERING');
  });

  it('uses the radiator to explain brown tips', () => {
    const [first] = diagnose(['BROWN_TIPS'], {
      ...usual,
      radiatorDistance: 'NEAR',
    });
    expect(first.cause).toBe('DRY_AIR');
    expect(first.reasons).toHaveLength(1);
  });

  it('does not add a cause that no symptom points to', () => {
    const causes = diagnose(['PESTS_VISIBLE'], {
      ...usual,
      radiatorDistance: 'NEAR',
      lightCondition: 'LOW',
    });
    expect(causes.map((c) => c.cause)).toEqual(['PESTS']);
  });

  it('returns at most MAX_CAUSES causes, strongest first', () => {
    const causes = diagnose([...SYMPTOM_CODES], usual);
    expect(causes.length).toBeLessThanOrEqual(MAX_CAUSES);
    for (let i = 1; i < causes.length; i += 1) {
      expect(causes[i - 1].score).toBeGreaterThanOrEqual(causes[i].score);
    }
  });

  it('counts a repeated symptom once', () => {
    expect(diagnose(['BURN_SPOTS', 'BURN_SPOTS'], usual)).toEqual(
      diagnose(['BURN_SPOTS'], usual),
    );
  });
});

describe('symptom catalog', () => {
  it('points every symptom to known causes that have texts in both languages', () => {
    for (const code of SYMPTOM_CODES) {
      for (const cause of Object.keys(SYMPTOM_WEIGHTS[code])) {
        const info = CAUSES[cause as keyof typeof CAUSES];
        expect(info.title.en && info.title.uk).toBeTruthy();
        expect(info.actions.length).toBeGreaterThan(0);
        for (const action of info.actions) {
          expect(action.en && action.uk).toBeTruthy();
        }
      }
    }
  });
});
