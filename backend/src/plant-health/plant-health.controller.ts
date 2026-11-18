import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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
import { PlantDto, toPlantDto } from '../plants/dto/plant.dto.js';
import {
  DiagnoseDto,
  DiagnosisDto,
  SetPlantStatusDto,
  SymptomDto,
} from './dto/plant-health.dto.js';
import { PlantHealthService } from './plant-health.service.js';

const NOT_FOUND = 'The plant does not exist or belongs to another user';

@ApiTags('plant-health')
@Controller()
export class PlantHealthController {
  constructor(private readonly health: PlantHealthService) {}

  @Get('symptoms')
  @ApiOperation({ summary: 'Symptoms a plant owner can report (EN and UK)' })
  @ApiOkResponse({ type: SymptomDto, isArray: true })
  listSymptoms(): SymptomDto[] {
    return this.health.listSymptoms();
  }

  @Put('plants/:plantId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiOperation({
    summary: 'Set the plant status: HEALTHY, NEEDS_ATTENTION or DEAD',
  })
  @ApiOkResponse({ type: PlantDto })
  @ApiBadRequestResponse({ description: 'Unknown status' })
  @ApiNotFoundResponse({ description: NOT_FOUND })
  async setStatus(
    @Req() request: AuthenticatedRequest,
    @Param('plantId') plantId: string,
    @Body() dto: SetPlantStatusDto,
  ): Promise<PlantDto> {
    return toPlantDto(
      await this.health.setStatus(request.user.id, plantId, dto.status),
    );
  }

  @Post('plants/:plantId/diagnosis')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiOperation({
    summary:
      "Likely causes and what to do for the reported symptoms, using the plant's own data. Nothing is saved.",
  })
  @ApiOkResponse({ type: DiagnosisDto })
  @ApiBadRequestResponse({ description: 'Empty, repeated or unknown symptoms' })
  @ApiNotFoundResponse({ description: NOT_FOUND })
  diagnose(
    @Req() request: AuthenticatedRequest,
    @Param('plantId') plantId: string,
    @Body() dto: DiagnoseDto,
  ): Promise<DiagnosisDto> {
    return this.health.diagnose(request.user.id, plantId, dto.symptoms);
  }
}
