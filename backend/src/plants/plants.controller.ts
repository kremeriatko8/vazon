import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiPayloadTooLargeResponse,
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
import { UpdatePlantDto } from './dto/update-plant.dto.js';
import { PlantsService } from './plants.service.js';

const NOT_FOUND = 'The plant does not exist or belongs to another user';

/** Largest accepted photo, in bytes. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** The part of a multer file this controller uses (avoids a dependency on @types/multer). */
interface UploadedPhoto {
  buffer: Buffer;
}

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

  @Patch(':plantId')
  @ApiOperation({ summary: 'Change some fields of a plant' })
  @ApiOkResponse({ type: PlantDto })
  @ApiBadRequestResponse({
    description:
      'Empty body, invalid or null value, unknown field, or unknown speciesId',
  })
  @ApiNotFoundResponse({ description: NOT_FOUND })
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('plantId') plantId: string,
    @Body() dto: UpdatePlantDto,
  ): Promise<PlantDto> {
    return toPlantDto(
      await this.plantsService.update(request.user.id, plantId, dto),
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

  @Post(':plantId/photo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: { fileSize: MAX_PHOTO_BYTES, files: 1, fields: 0 },
    }),
  )
  @ApiOperation({
    summary:
      'Upload or replace the plant photo (JPEG, PNG or WebP, up to 5 MB)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['photo'],
      properties: { photo: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ type: PlantDto })
  @ApiBadRequestResponse({
    description:
      'No file in the "photo" field, or not a JPEG, PNG or WebP image',
  })
  @ApiPayloadTooLargeResponse({ description: 'The file is larger than 5 MB' })
  @ApiNotFoundResponse({ description: NOT_FOUND })
  async uploadPhoto(
    @Req() request: AuthenticatedRequest,
    @Param('plantId') plantId: string,
    @UploadedFile() file: UploadedPhoto | undefined,
  ): Promise<PlantDto> {
    if (!file) throw new BadRequestException('photo file is required');
    return toPlantDto(
      await this.plantsService.setPhoto(request.user.id, plantId, file.buffer),
    );
  }

  @Delete(':plantId/photo')
  @ApiOperation({ summary: 'Remove the plant photo' })
  @ApiOkResponse({ type: PlantDto })
  @ApiNotFoundResponse({ description: NOT_FOUND })
  async removePhoto(
    @Req() request: AuthenticatedRequest,
    @Param('plantId') plantId: string,
  ): Promise<PlantDto> {
    return toPlantDto(
      await this.plantsService.removePhoto(request.user.id, plantId),
    );
  }
}
