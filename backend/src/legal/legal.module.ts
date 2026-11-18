import { Module } from '@nestjs/common';
import { PrivacyController } from './privacy.controller.js';

/** Public legal pages. */
@Module({ controllers: [PrivacyController] })
export class LegalModule {}
