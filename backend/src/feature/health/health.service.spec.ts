import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('returns health response with status and timestamp', () => {
    const result = service.getHealth();
    expect(result).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
    });
  });
});
