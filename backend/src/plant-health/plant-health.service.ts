import { Injectable } from '@nestjs/common';
import type { Plant } from '../generated/prisma/client.js';
import type { PlantStatus } from '../generated/prisma/enums.js';
import {
  daysBetween,
  intervalDays,
  seasonFor,
} from '../care-schedules/schedule.engine.js';
import { resolveWaterNeed } from '../care-schedules/care-tasks.service.js';
import { PlantsService } from '../plants/plants.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { type DiagnosisContext, diagnose } from './diagnosis.js';
import type { DiagnosisDto } from './dto/plant-health.dto.js';
import {
  SYMPTOMS,
  SYMPTOM_CODES,
  type SymptomCode,
} from './symptoms.catalog.js';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PlantHealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plants: PlantsService,
  ) {}

  /** The symptom catalog, in a fixed order. */
  listSymptoms(): { code: SymptomCode; title: { en: string; uk: string } }[] {
    return SYMPTOM_CODES.map((code) => ({ code, title: SYMPTOMS[code] }));
  }

  /** Sets the owner's plant status. statusChangedAt moves only on a real change. */
  async setStatus(
    ownerId: string,
    plantId: string,
    status: PlantStatus,
    now = new Date(),
  ): Promise<Plant> {
    const plant = await this.plants.findOwnedOrThrow(ownerId, plantId);
    if (plant.status === status) return plant;
    return this.prisma.plant.update({
      where: { id: plant.id },
      data: { status, statusChangedAt: now },
    });
  }

  /** Likely causes for the symptoms, using the plant's settings and care history. */
  async diagnose(
    ownerId: string,
    plantId: string,
    symptoms: SymptomCode[],
    now = new Date(),
  ): Promise<DiagnosisDto> {
    const plant = await this.plants.findOwnedOrThrow(ownerId, plantId);
    const species = plant.speciesId
      ? await this.prisma.species.findUnique({
          where: { id: plant.speciesId },
          select: { waterNeed: true, wateringFactor: true },
        })
      : null;
    const { waterNeed } = resolveWaterNeed(plant, species?.waterNeed);

    const since = new Date(now.getTime() - 14 * DAY_MS);
    const recent = await this.prisma.careHistory.findMany({
      where: {
        plantId: plant.id,
        actionType: { in: ['WATERED', 'SOIL_WET'] },
        actionDate: { gte: since },
      },
      select: { actionType: true },
    });
    const lastWatered = await this.prisma.careHistory.findFirst({
      where: { plantId: plant.id, actionType: 'WATERED' },
      orderBy: [{ actionDate: 'desc' }, { createdAt: 'desc' }],
      select: { actionDate: true },
    });

    const context: DiagnosisContext = {
      waterNeed,
      lightCondition: plant.lightCondition,
      potSize: plant.potSize,
      radiatorDistance: plant.radiatorDistance,
      wateringIntervalDays: intervalDays({
        plant: { ...plant, waterNeed, wateringFactor: species?.wateringFactor },
        taskType: 'WATER',
        lastDoneDate: now,
        season: seasonFor(now),
        soilWetCount: 0,
      }),
      daysSinceWatered: lastWatered
        ? daysBetween(lastWatered.actionDate, now)
        : null,
      wateringsLast14Days: recent.filter((e) => e.actionType === 'WATERED')
        .length,
      soilWetLast14Days: recent.filter((e) => e.actionType === 'SOIL_WET')
        .length,
    };

    const causes = diagnose(symptoms, context);
    const serious = causes.some((c) => c.confidence !== 'LOW');
    return {
      plantId: plant.id,
      symptoms,
      causes: causes.map((c) => ({ ...c, actions: [...c.actions] })),
      suggestedStatus:
        serious && plant.status === 'HEALTHY'
          ? 'NEEDS_ATTENTION'
          : plant.status,
    };
  }
}
