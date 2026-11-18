import { Controller, Get, Header } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PRIVACY_POLICY_HTML } from './privacy-page.js';

@ApiTags('legal')
@Controller('privacy')
export class PrivacyController {
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  @ApiOperation({
    summary: 'Privacy policy page (HTML, English and Ukrainian)',
  })
  @ApiOkResponse({ description: 'HTML page' })
  page(): string {
    return PRIVACY_POLICY_HTML;
  }
}
