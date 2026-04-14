import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SuggestUrlsService } from './suggest-urls.service';

describe('SuggestUrlsService', () => {
  let service: SuggestUrlsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggestUrlsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_key: string, defaultValue?: string) => defaultValue),
          },
        },
      ],
    }).compile();

    service = module.get<SuggestUrlsService>(SuggestUrlsService);
  });

  it('heuristicUrls builds fr/com variants from a simple name', () => {
    const urls = service.heuristicUrls('Mon Magasin');
    expect(urls).toContain('https://www.mon-magasin.fr');
    expect(urls).toContain('https://mon-magasin.com');
  });

  it('heuristicUrls returns empty for non-alphanumeric slug', () => {
    expect(service.heuristicUrls('!!!')).toEqual([]);
  });

  it('normalizeUrlList dedupes and caps length', () => {
    const urls = service.normalizeUrlList([
      'https://a.com/',
      'https://a.com',
      'not-a-url',
      'https://b.com/path/',
    ]);
    expect(urls).toEqual(['https://a.com', 'https://b.com/path']);
  });
});
