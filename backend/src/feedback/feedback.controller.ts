import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateFeedbackDto } from './dto/create-feedback.dto.js';
import { FeedbackCreatedDto } from './dto/feedback-created.dto.js';
import { FeedbackService } from './feedback.service.js';
import {
  type MaybeAuthenticatedRequest,
  OptionalJwtAuthGuard,
} from './optional-jwt-auth.guard.js';

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Send feedback about the website. Works without a token; with a valid token it is linked to the user.',
  })
  @ApiCreatedResponse({ type: FeedbackCreatedDto })
  @ApiBadRequestResponse({
    description: 'Invalid category, empty or too long message, or invalid page',
  })
  async create(
    @Req() request: MaybeAuthenticatedRequest,
    @Body() dto: CreateFeedbackDto,
  ): Promise<FeedbackCreatedDto> {
    const feedback = await this.feedbackService.create(dto, {
      userId: request.user?.id,
      userAgent: request.headers['user-agent'],
    });
    return { id: feedback.id, createdAt: feedback.createdAt };
  }
}
