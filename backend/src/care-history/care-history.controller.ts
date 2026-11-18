import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
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
import { CareTasksService } from '../care-schedules/care-tasks.service.js';
import { CareHistoryService } from './care-history.service.js';
import { CareLogDto, toCareLogDto } from './dto/care-log.dto.js';
import { CreateCareLogDto } from './dto/create-care-log.dto.js';

const NOT_FOUND = 'The plant does not exist or belongs to another user';

/** Care history routes. The per-plant routes live here, not in PlantsController. */
@ApiTags('care-history')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
@UseGuards(JwtAuthGuard)
@Controller()
export class CareHistoryController {
  constructor(
    private readonly careHistory: CareHistoryService,
    private readonly careTasks: CareTasksService,
  ) {}

  @Get('plants/:plantId/care-history')
  @ApiOperation({ summary: 'Care history of one plant, newest first' })
  @ApiOkResponse({ type: CareLogDto, isArray: true })
  @ApiNotFoundResponse({ description: NOT_FOUND })
  async findForPlant(
    @Req() request: AuthenticatedRequest,
    @Param('plantId') plantId: string,
  ): Promise<CareLogDto[]> {
    const entries = await this.careHistory.findForPlant(
      request.user.id,
      plantId,
    );
    return entries.map(toCareLogDto);
  }

  @Post('plants/:plantId/care-history')
  @ApiOperation({ summary: 'Log a care action for one plant' })
  @ApiCreatedResponse({ type: CareLogDto })
  @ApiBadRequestResponse({ description: 'Invalid actionType or notes' })
  @ApiNotFoundResponse({ description: NOT_FOUND })
  @ApiConflictResponse({
    description:
      'TOO_EARLY: WATERED or FED within half of the interval (send confirm: true to log anyway). ALREADY_LOGGED_TODAY: a second SOIL_WET on the same day.',
  })
  async create(
    @Req() request: AuthenticatedRequest,
    @Param('plantId') plantId: string,
    @Body() dto: CreateCareLogDto,
  ): Promise<CareLogDto> {
    await this.careTasks.assertCanLog(
      request.user.id,
      plantId,
      dto.actionType,
      dto.confirm === true,
    );
    return toCareLogDto(
      await this.careHistory.create(request.user.id, plantId, dto),
    );
  }

  @Get('care-history')
  @ApiOperation({
    summary: "Care history of all the current user's plants, newest first",
  })
  @ApiOkResponse({ type: CareLogDto, isArray: true })
  async findAll(@Req() request: AuthenticatedRequest): Promise<CareLogDto[]> {
    const entries = await this.careHistory.findAllForOwner(request.user.id);
    return entries.map(toCareLogDto);
  }
}
