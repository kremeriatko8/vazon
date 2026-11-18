import type {
  LightCondition,
  PotSize,
  RadiatorDistance,
  WaterNeed,
} from '../generated/prisma/enums.js';
import {
  CAUSES,
  type CauseCode,
  type LocalizedText,
  SYMPTOM_WEIGHTS,
  type SymptomCode,
} from './symptoms.catalog.js';

/** What the diagnosis knows about the plant besides the symptoms. */
export interface DiagnosisContext {
  waterNeed: WaterNeed;
  lightCondition: LightCondition;
  potSize: PotSize;
  radiatorDistance: RadiatorDistance;
  /** Current watering interval from the schedule engine, in days. */
  wateringIntervalDays: number;
  /** Days since the last WATERED entry, or null if never logged. */
  daysSinceWatered: number | null;
  /** WATERED entries in the last 14 days. */
  wateringsLast14Days: number;
  /** SOIL_WET entries in the last 14 days. */
  soilWetLast14Days: number;
}

export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface DiagnosisCause {
  cause: CauseCode;
  confidence: Confidence;
  score: number;
  title: LocalizedText;
  /** Facts from the plant's data that made this cause more likely. */
  reasons: LocalizedText[];
  actions: readonly LocalizedText[];
}

/** Extra points from the plant's own data. */
const CONTEXT_POINTS = 2;
/** At most this many causes are returned. */
export const MAX_CAUSES = 3;

/**
 * Ranks likely causes for the reported symptoms. Pure: no database, no clock.
 * Each symptom adds points to the causes it points to (SYMPTOM_WEIGHTS); the
 * plant's own data adds CONTEXT_POINTS to a cause it supports, but only to a
 * cause that some symptom already points to.
 */
export function diagnose(
  symptoms: readonly SymptomCode[],
  context: DiagnosisContext,
): DiagnosisCause[] {
  const scores = new Map<CauseCode, number>();
  for (const symptom of new Set(symptoms)) {
    for (const [cause, points] of Object.entries(SYMPTOM_WEIGHTS[symptom])) {
      const code = cause as CauseCode;
      scores.set(code, (scores.get(code) ?? 0) + (points ?? 0));
    }
  }

  const reasons = new Map<CauseCode, LocalizedText[]>();
  const support = (cause: CauseCode, reason: LocalizedText) => {
    if (!scores.has(cause)) return;
    scores.set(cause, (scores.get(cause) ?? 0) + CONTEXT_POINTS);
    reasons.set(cause, [...(reasons.get(cause) ?? []), reason]);
  };

  const expectedWaterings = 14 / Math.max(1, context.wateringIntervalDays);
  if (context.wateringsLast14Days > expectedWaterings + 1) {
    support('OVERWATERING', {
      en: `Watered ${context.wateringsLast14Days} times in 14 days; the schedule expects about ${Math.round(expectedWaterings)}.`,
      uk: `Поливали ${context.wateringsLast14Days} разів за 14 днів, а за розкладом приблизно ${Math.round(expectedWaterings)}.`,
    });
  }
  if (context.waterNeed === 'LOW') {
    support('OVERWATERING', {
      en: 'This species needs little water and rots easily.',
      uk: 'Цей вид потребує мало води й легко загниває.',
    });
  }
  if (context.soilWetLast14Days >= 2) {
    support('OVERWATERING', {
      en: 'The soil was still wet at several recent checks.',
      uk: 'Під час кількох останніх перевірок ґрунт був ще вологий.',
    });
  }
  if (
    context.daysSinceWatered !== null &&
    context.daysSinceWatered > context.wateringIntervalDays * 1.5
  ) {
    support('UNDERWATERING', {
      en: `Last watered ${context.daysSinceWatered} days ago, with an interval of ${context.wateringIntervalDays} days.`,
      uk: `Останній полив ${context.daysSinceWatered} днів тому, а інтервал ${context.wateringIntervalDays} днів.`,
    });
  }
  if (context.daysSinceWatered === null) {
    support('UNDERWATERING', {
      en: 'No watering has been logged yet.',
      uk: 'Жодного поливу ще не записано.',
    });
  }
  if (context.radiatorDistance === 'NEAR') {
    support('DRY_AIR', {
      en: 'The plant stands less than 1 m from a radiator.',
      uk: 'Рослина стоїть ближче ніж за 1 м від батареї.',
    });
  }
  if (context.lightCondition === 'LOW') {
    support('LOW_LIGHT', {
      en: 'The plant is in low light.',
      uk: 'Рослина стоїть у тіні.',
    });
  }
  if (context.lightCondition === 'DIRECT') {
    support('TOO_MUCH_SUN', {
      en: 'The plant gets direct sun.',
      uk: 'На рослину падає пряме сонце.',
    });
  }
  if (context.potSize === 'SMALL') {
    support('ROOT_BOUND', {
      en: 'The plant is in a small pot.',
      uk: 'Рослина в маленькому горщику.',
    });
  }

  return [...scores.entries()]
    .filter(([, score]) => score > 0)
    .sort(([a, sa], [b, sb]) => sb - sa || a.localeCompare(b))
    .slice(0, MAX_CAUSES)
    .map(([cause, score]) => ({
      cause,
      score,
      confidence: confidenceFor(score),
      title: CAUSES[cause].title,
      reasons: reasons.get(cause) ?? [],
      actions: CAUSES[cause].actions,
    }));
}

function confidenceFor(score: number): Confidence {
  if (score >= 5) return 'HIGH';
  if (score >= 3) return 'MEDIUM';
  return 'LOW';
}
