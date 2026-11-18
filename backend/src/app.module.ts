import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { CareHistoryModule } from './care-history/care-history.module.js';
import { CareSchedulesModule } from './care-schedules/care-schedules.module.js';
import { validateEnv } from './config/env.validation.js';
import { FeedbackModule } from './feedback/feedback.module.js';
import { HealthModule } from './health/health.module.js';
import { PlantsModule } from './plants/plants.module.js';
import { SpeciesModule } from './species/species.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      cache: true,
    }),
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    PlantsModule,
    SpeciesModule,
    FeedbackModule,
    CareHistoryModule,
    CareSchedulesModule,
    SettingsModule,
  ],
})
export class AppModule {}
