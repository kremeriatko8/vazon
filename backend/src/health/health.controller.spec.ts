import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();
    controller = moduleRef.get(HealthController);
  });

  it('returns status "ok" with the service name and an ISO timestamp', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('vazon-backend');
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });
});
