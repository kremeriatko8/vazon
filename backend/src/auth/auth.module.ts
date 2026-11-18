import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

/**
 * Reads JWT settings from the environment. There is no default secret:
 * the app refuses to start when JWT_SECRET is missing or empty.
 */
export function jwtOptionsFromConfig(config: ConfigService): JwtModuleOptions {
  const secret = config.get<string>('JWT_SECRET');
  if (!secret || secret.trim().length === 0) {
    throw new Error(
      'Invalid environment configuration: JWT_SECRET must be set',
    );
  }
  const expiresIn = config.get<string>('JWT_EXPIRES_IN') || '1h';
  return {
    secret,
    signOptions: {
      algorithm: 'HS256',
      // Accepts the formats of the "ms" package, for example "15m", "1h", "7d".
      expiresIn: expiresIn as NonNullable<
        JwtModuleOptions['signOptions']
      >['expiresIn'],
    },
    verifyOptions: { algorithms: ['HS256'] },
  };
}

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: jwtOptionsFromConfig,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  // Other modules import AuthModule to protect their routes with JwtAuthGuard.
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
