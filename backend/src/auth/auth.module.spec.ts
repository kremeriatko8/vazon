import { ConfigService } from '@nestjs/config';
import { jwtOptionsFromConfig } from './auth.module.js';

function configWith(values: Record<string, string | undefined>): ConfigService {
  return new ConfigService(values);
}

describe('jwtOptionsFromConfig', () => {
  it('throws when JWT_SECRET is missing (no default secret)', () => {
    expect(() => jwtOptionsFromConfig(configWith({}))).toThrow(/JWT_SECRET/);
  });

  it('throws when JWT_SECRET is empty', () => {
    expect(() =>
      jwtOptionsFromConfig(configWith({ JWT_SECRET: '  ' })),
    ).toThrow(/JWT_SECRET/);
  });

  it('defaults JWT_EXPIRES_IN to 1h', () => {
    const options = jwtOptionsFromConfig(configWith({ JWT_SECRET: 's' }));
    expect(options.secret).toBe('s');
    expect(options.signOptions?.expiresIn).toBe('1h');
  });

  it('uses JWT_EXPIRES_IN when set', () => {
    const options = jwtOptionsFromConfig(
      configWith({ JWT_SECRET: 's', JWT_EXPIRES_IN: '15m' }),
    );
    expect(options.signOptions?.expiresIn).toBe('15m');
  });
});
