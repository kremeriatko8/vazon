import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SearchSpeciesQuery } from './dto/search-species.query.js';
import { SpeciesDto, toSpeciesDto } from './dto/species.dto.js';
import { SpeciesService } from './species.service.js';

/** Public: the catalog contains no user data. */
@ApiTags('species')
@Controller('species')
export class SpeciesController {
  constructor(private readonly speciesService: SpeciesService) {}

  @Get()
  @ApiOperation({ summary: 'Search the species catalog (for autocomplete)' })
  @ApiOkResponse({ type: SpeciesDto, isArray: true })
  @ApiBadRequestResponse({ description: 'search too long or invalid limit' })
  async search(@Query() query: SearchSpeciesQuery): Promise<SpeciesDto[]> {
    const species = await this.speciesService.search(query.search, query.limit);
    return species.map(toSpeciesDto);
  }

  @Get(':speciesId')
  @ApiOperation({ summary: 'Get one species' })
  @ApiOkResponse({ type: SpeciesDto })
  @ApiNotFoundResponse({ description: 'Unknown or malformed id' })
  async findOne(@Param('speciesId') speciesId: string): Promise<SpeciesDto> {
    return toSpeciesDto(await this.speciesService.findByIdOrThrow(speciesId));
  }
}
