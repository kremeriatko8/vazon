import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  type AuthenticatedRequest,
  JwtAuthGuard,
} from '../auth/jwt-auth.guard.js';
import { CreatePlantDto } from './dto/create-plant.dto.js';
import { PlantDto, toPlantDto } from './dto/plant.dto.js';
import { PlantsService } from './plants.service.js';

const NOT_FOUND = 'The plant does not exist or belongs to another user';

@ApiTags('plants')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
@UseGuards(JwtAuthGuard)
@Controller('plants')
export class PlantsController {
  constructor(private readonly plantsService: PlantsService) {}

  @Get()
  @ApiOperation({ summary: "List the current user's plants" })
  @ApiOkResponse({ type: PlantDto, isArray: true })
  async findAll(@Req() request: AuthenticatedRequest): Promise<PlantDto[]> {
    const plants = await this.plantsService.findAllForOwner(request.user.id);
    return plants.map(toPlantDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a plant owned by the current user' })
  @ApiCreatedResponse({ type: PlantDto })
  @ApiBadRequestResponse({
    description: 'Missing fields or an invalid enum value',
  })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreatePlantDto,
  ): Promise<PlantDto> {
    return toPlantDto(await this.plantsService.create(request.user.id, dto));
  }

  @Get(':plantId')
  @ApiOperation({ summary: 'Get one plant of the current user' })
  @ApiOkResponse({ type: PlantDto })
  @ApiNotFoundResponse({ description: NOT_FOUND })
  async findOne(
    @Req() request: AuthenticatedRequest,
    @Param('plantId') plantId: string,
  ): Promise<PlantDto> {
    return toPlantDto(
      await this.plantsService.findOwnedOrThrow(request.user.id, plantId),
    );
  }

  @Delete(':plantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a plant with its tasks and care logs' })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiNotFoundResponse({ description: NOT_FOUND })
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('plantId') plantId: string,
  ): Promise<void> {
    return this.plantsService.remove(request.user.id, plantId);
  }
}
