import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  type AuthenticatedRequest,
  JwtAuthGuard,
} from '../auth/jwt-auth.guard.js';
import { SettingsDto, UpdateSettingsDto } from './dto/settings.dto.js';
import { SettingsService } from './settings.service.js';

@ApiTags('settings')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
@UseGuards(JwtAuthGuard)
@Controller('me/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({
    summary: "The current user's settings (defaults if never saved)",
  })
  @ApiOkResponse({ type: SettingsDto })
  get(@Req() request: AuthenticatedRequest): Promise<SettingsDto> {
    return this.settingsService.get(request.user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Change some settings' })
  @ApiOkResponse({ type: SettingsDto })
  @ApiBadRequestResponse({
    description: 'Empty body, invalid or null value, or unknown field',
  })
  update(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateSettingsDto,
  ): Promise<SettingsDto> {
    return this.settingsService.update(request.user.id, dto);
  }
}
