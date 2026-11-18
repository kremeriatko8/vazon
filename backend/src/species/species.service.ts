import { Injectable, NotFoundException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import type { Species } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DEFAULT_SPECIES_LIMIT } from './dto/search-species.query.js';

/** Read-only access to the species catalog. Rows come from a data migration. */
@Injectable()
export class SpeciesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Species whose botanical or common name contains `search` (case-insensitive),
   * ordered by common name. Without `search`, the first `limit` species A–Z.
   */
  search(search?: string, limit = DEFAULT_SPECIES_LIMIT): Promise<Species[]> {
    const where = search
      ? {
          OR: [
            {
              scientificName: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            { commonName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    return this.prisma.species.findMany({
      where,
      orderBy: [{ commonName: 'asc' }, { scientificName: 'asc' }],
      take: limit,
    });
  }

  async findByIdOrThrow(id: string): Promise<Species> {
    const species = await this.findById(id);
    if (!species) throw new NotFoundException('Species not found');
    return species;
  }

  /** Null when the id is malformed or unknown. Used by plants to validate speciesId. */
  findById(id: string): Promise<Species | null> {
    if (!isUUID(id)) return Promise.resolve(null);
    return this.prisma.species.findUnique({ where: { id } });
  }
}
