import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import type { Plant } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SpeciesService } from '../species/species.service.js';
import { detectImageType } from './photos/image-type.js';
import { PhotoStorageService } from './photos/photo-storage.service.js';
import type { CreatePlantDto } from './dto/create-plant.dto.js';
import {
  UPDATABLE_PLANT_FIELDS,
  type UpdatePlantDto,
} from './dto/update-plant.dto.js';

/**
 * The only place that reads or writes the plants table.
 * Every method takes the owner's id and never touches another user's plants.
 */
@Injectable()
export class PlantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly species: SpeciesService,
    private readonly photos: PhotoStorageService,
  ) {}

  /** The owner's plants, newest first. */
  findAllForOwner(ownerId: string): Promise<Plant[]> {
    return this.prisma.plant.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(ownerId: string, dto: CreatePlantDto): Promise<Plant> {
    // Checked before the insert so that the only foreign key that can still
    // fail below is the owner's.
    if (dto.speciesId && !(await this.species.findById(dto.speciesId))) {
      throw new BadRequestException('speciesId does not match any species');
    }
    try {
      return await this.prisma.plant.create({
        data: {
          ownerId,
          name: dto.name,
          species: dto.species,
          lightCondition: dto.lightCondition,
          potSize: dto.potSize,
          // Prisma applies the schema default (NONE) when this is undefined.
          radiatorDistance: dto.radiatorDistance,
          speciesId: dto.speciesId,
        },
      });
    } catch (error) {
      // P2003: foreign key violated. The token is valid but its user no longer
      // exists (for example, the database was reset). Treat it as signed out.
      if (hasPrismaCode(error, 'P2003')) throw new UnauthorizedException();
      throw error;
    }
  }

  /**
   * Returns the plant if it exists and belongs to `ownerId`.
   * Otherwise throws 404, so callers cannot tell "not yours" from "does not exist".
   * Other modules (care history, tasks) use this to check ownership.
   */
  async findOwnedOrThrow(ownerId: string, plantId: string): Promise<Plant> {
    // The column is a UUID: a malformed id would make PostgreSQL fail with 500.
    if (!isUUID(plantId)) throw plantNotFound();
    const plant = await this.prisma.plant.findFirst({
      where: { id: plantId, ownerId },
    });
    if (!plant) throw plantNotFound();
    return plant;
  }

  /**
   * Deletes the plant and its photo file. Tasks and care history are removed
   * by ON DELETE CASCADE.
   */
  async remove(ownerId: string, plantId: string): Promise<void> {
    const { photoKey } = await this.findOwnedOrThrow(ownerId, plantId);
    // deleteMany keeps the owner in the same statement.
    const { count } = await this.prisma.plant.deleteMany({
      where: { id: plantId, ownerId },
    });
    if (count === 0) throw plantNotFound();
    if (photoKey) await this.photos.remove(photoKey);
  }

  /**
   * Changes only the fields present in `dto`. `speciesId: null` removes the
   * catalog link. An empty body is rejected with 400.
   */
  async update(
    ownerId: string,
    plantId: string,
    dto: UpdatePlantDto,
  ): Promise<Plant> {
    const data = Object.fromEntries(
      UPDATABLE_PLANT_FIELDS.filter((field) => dto[field] !== undefined).map(
        (field) => [field, dto[field]],
      ),
    ) as UpdatePlantDto;
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Send at least one field to change');
    }
    const plant = await this.findOwnedOrThrow(ownerId, plantId);
    if (data.speciesId && !(await this.species.findById(data.speciesId))) {
      throw new BadRequestException('speciesId does not match any species');
    }
    return this.prisma.plant.update({ where: { id: plant.id }, data });
  }

  /** Saves a new photo for the plant and deletes the previous one. */
  async setPhoto(
    ownerId: string,
    plantId: string,
    file: Buffer,
  ): Promise<Plant> {
    const plant = await this.findOwnedOrThrow(ownerId, plantId);
    const type = detectImageType(file);
    if (!type) {
      throw new BadRequestException('photo must be a JPEG, PNG or WebP image');
    }
    const previousKey = plant.photoKey;
    const key = await this.photos.save(file, type);
    let updated: Plant;
    try {
      updated = await this.prisma.plant.update({
        where: { id: plant.id },
        data: { photoKey: key },
      });
    } catch (error) {
      await this.photos.remove(key);
      throw error;
    }
    if (previousKey) await this.photos.remove(previousKey);
    return updated;
  }

  /** Removes the plant's photo. Does nothing if there is none. */
  async removePhoto(ownerId: string, plantId: string): Promise<Plant> {
    const plant = await this.findOwnedOrThrow(ownerId, plantId);
    const previousKey = plant.photoKey;
    if (!previousKey) return plant;
    const updated = await this.prisma.plant.update({
      where: { id: plant.id },
      data: { photoKey: null },
    });
    await this.photos.remove(previousKey);
    return updated;
  }
}

function plantNotFound(): NotFoundException {
  return new NotFoundException('Plant not found');
}

function hasPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}
