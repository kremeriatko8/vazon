import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
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
import { CareTasksService } from './care-tasks.service.js';
import { CareTaskDto } from './dto/care-task.dto.js';

@ApiTags('care-tasks')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
@UseGuards(JwtAuthGuard)
@Controller('care-tasks')
export class CareTasksController {
  constructor(private readonly careTasks: CareTasksService) {}

  @Get()
  @ApiOperation({
    summary:
      "Next WATER and FEED task for each of the current user's plants, soonest first",
  })
  @ApiOkResponse({ type: CareTaskDto, isArray: true })
  findAll(@Req() request: AuthenticatedRequest): Promise<CareTaskDto[]> {
    return this.careTasks.findForOwner(request.user.id);
  }
}
